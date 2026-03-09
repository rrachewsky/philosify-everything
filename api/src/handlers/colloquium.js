// ============================================================
// HANDLER - ACADEMIC COLLOQUIUM (Daily Philosopher Debates)
// ============================================================
// Two types of colloquiums:
//
// TYPE 1 (AI Daily): Auto-generated daily debate
//   - AI picks topic + 2 default philosophers
//   - Philosopher replies staggered via cron (8, 11, 14, 17, 20 UTC)
//   - Verdict at 23:00 UTC
//   - Access: 1 credit | Participate: 1 credit
//   - Participants can add more philosophers (2-3 credits each)
//
// TYPE 2 (User-Proposed): On-demand debate
//   - User proposes topic (5 credits, includes 4 AI-chosen philosophers)
//   - All philosopher replies generated immediately
//   - 60-minute window for participation
//   - Verdict auto-generates after 60 minutes
//   - Access: 1 credit | Participate: 2 credits
//   - Users can add more philosophers (2-3 credits each)
//
// Verdicts are generated in English (backend anchor) and translated to the
// proposer's language during generation.  Other languages are translated
// on-demand when users view/access the colloquium.
//
// Uses the same forum_threads / forum_replies tables as user debates,
// but with category='colloquium' and is_philosopher/philosopher_name
// columns on replies.

import { pg } from "../utils/pg.js";
import {
  getGuide,
  getWrapupSource,
  getDebateAestheticGuide,
} from "../guides/index.js";
import { callGrok } from "../ai/models/index.js";
import { generateGuideProofWithSignature } from "../guides/loader.js";
import {
  generateWrapupTTS,
  saveToR2Cache,
  getR2PublicUrl,
  translateWithGemini,
} from "../tts/gemini.js";
import { getSecret } from "../utils/secrets.js";
import { sendPushNotification } from "../push/sender.js";
import { getSupabaseCredentials } from "../utils/supabase.js";

// ============================================================
// REALTIME BROADCAST HELPER
// ============================================================

/**
 * Broadcast a colloquium event via Supabase Realtime.
 * Frontend subscribes to `colloquium:{threadId}` and refetches on events.
 * Non-fatal — errors are logged but never thrown.
 *
 * @param {object} env - Worker env
 * @param {string} threadId - Colloquium thread ID
 * @param {string} eventType - Event name: 'new-reply' | 'thread-updated'
 */

/**
 * Get all user IDs with access to a colloquium (for push notifications).
 * Returns unique user IDs from colloquium_access table.
 */
async function getColloquiumParticipantIds(env, threadId) {
  try {
    const rows = await pg(env, "GET", "colloquium_access", {
      filter: `thread_id=eq.${threadId}`,
      select: "user_id",
    });
    if (!rows || rows.length === 0) return [];
    // Deduplicate (a user can have multiple access types)
    return [...new Set(rows.map((r) => r.user_id))];
  } catch (err) {
    console.warn(
      `[Colloquium] Failed to fetch participants for push: ${err.message}`,
    );
    return [];
  }
}

/**
 * Send push notification to all colloquium participants.
 * Fire-and-forget — failures are logged but don't block.
 */
async function notifyColloquiumParticipants(env, threadId, payload) {
  try {
    const userIds = await getColloquiumParticipantIds(env, threadId);
    if (userIds.length === 0) return;

    await Promise.allSettled(
      userIds.map((userId) => sendPushNotification(env, userId, payload)),
    );
  } catch (err) {
    console.warn(`[Colloquium] Push notification failed: ${err.message}`);
  }
}

export async function broadcastColloquiumEvent(
  env,
  threadId,
  eventType,
  extraPayload,
) {
  try {
    const { url, key } = await getSupabaseCredentials(env);
    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `colloquium:${threadId}`,
            event: eventType,
            payload: { threadId, event_type: eventType, ...extraPayload },
          },
        ],
      }),
    });
    if (!res.ok) {
      console.warn(
        `[Colloquium] Broadcast ${eventType} HTTP ${res.status} for ${threadId}`,
      );
    }
  } catch (err) {
    console.warn(
      `[Colloquium] Broadcast ${eventType} failed for ${threadId}:`,
      err.message,
    );
  }
}

// ============================================================
// PHILOSOPHER PROFILES
// ============================================================
// Each profile contains:
//   - works: Primary texts the AI must draw arguments from
//   - doctrines: Core philosophical positions with doctrinal precision
//   - stances: Known positions on recurring topics (ethics, politics,
//     metaphysics, epistemology, human nature) to prevent fabrication
//   - style: How they argued — their rhetorical method, NOT their conclusions
//
// INTELLECTUAL INTEGRITY RULE:
// Every argument a philosopher makes MUST be deducible from their
// documented works and known doctrines. When a topic is modern,
// the AI must DEDUCE what the philosopher would say by applying
// their established principles — never invent, distort, or
// contradict their actual philosophy.

const PHILOSOPHERS = [
  {
    name: "A. J. Ayer",
    era: "Modern (1910-1989)",
    school: "Logical Positivism / Analytic Philosophy",
    works:
      "Language, Truth and Logic, The Problem of Knowledge, The Foundations of Empirical Knowledge, Probability and Evidence, The Central Questions of Philosophy",
    doctrines:
      "The verification principle: a statement is meaningful only if it is either analytically true (true by definition) or empirically verifiable. Statements about God, metaphysics, and ethics are literally meaningless — they express no propositions. Ethical statements are expressions of emotion, not statements of fact (emotivism/the 'Boo-Hurrah' theory). Philosophy's proper task is logical analysis of language, not metaphysical speculation. Knowledge requires the right to be sure, not just true belief.",
    stances:
      "ETHICS: Moral judgments are expressions of attitude, not factual claims — 'Stealing is wrong' means roughly 'Stealing — boo!' No objective moral truths exist. POLITICS: Liberal humanist; opposed censorship and defended civil liberties. METAPHYSICS: Metaphysical claims are meaningless pseudo-propositions. The question 'Does God exist?' is not false but nonsensical. EPISTEMOLOGY: Radical empiricist — all substantive knowledge comes from sense experience. A priori truths are tautologies. HUMAN NATURE: No fixed essence discoverable by philosophy; humans are empirical beings studied by science.",
    style:
      "Lucid, combative, and polemical. Writes with crisp clarity and rhetorical confidence. Dismisses metaphysics with elegant ruthlessness.",
  },
  {
    name: "Adam Smith",
    era: "Enlightenment (1723-1790)",
    school: "Classical Liberalism / Political Economy",
    works:
      "The Wealth of Nations (An Inquiry into the Nature and Causes of the Wealth of Nations), The Theory of Moral Sentiments, Lectures on Jurisprudence, Essays on Philosophical Subjects",
    doctrines:
      'The invisible hand: individuals pursuing their own self-interest in a free market unintentionally promote the public good — "It is not from the benevolence of the butcher, the brewer, or the baker that we expect our dinner, but from their regard to their own interest" (WN I.ii.2). The division of labor is the primary source of productivity and wealth (pin factory example). Sympathy (fellow-feeling) as the foundation of moral judgment: we judge actions by imaginatively placing ourselves in the position of the agent and an impartial spectator (TMS). The impartial spectator: an internalized, ideal observer whose approval or disapproval constitutes the standard of moral judgment. Free trade and competition benefit all parties; mercantilism and monopoly harm the public. The natural system of liberty: when government removes artificial barriers, the economy self-organizes for maximum prosperity.',
    stances:
      'ETHICS: Moral judgments are based on sympathy and the impartial spectator — not utility calculations or divine command. Prudence, justice, and beneficence are the chief virtues. Self-interest is natural and beneficial when constrained by justice — but justice is the indispensable foundation of society (TMS). POLITICS: Limited government — the state should provide defense, justice, and public works that private enterprise cannot sustain. Opposed mercantilism, trade restrictions, monopolies, and corporate privilege. Sympathetic to workers exploited by master manufacturers. Favored progressive taxation — "It is not very unreasonable that the rich should contribute to the public expense, not only in proportion to their revenue, but something more than in that proportion" (WN V.ii.e.6). METAPHYSICS: Not a systematic metaphysician; broadly empiricist. EPISTEMOLOGY: Knowledge comes from experience and observation; economic science requires careful attention to how people actually behave, not how theory says they should. HUMAN NATURE: Humans are naturally social, sympathetic, and self-interested — these are not contradictory. The desire for approval and the capacity for fellow-feeling are as natural as the desire for gain.',
    style:
      "Clear, measured, and humane. Combines philosophical depth with practical economic observation. Uses vivid examples and historical illustrations. Balances sympathy for the poor with respect for the productive power of free enterprise.",
  },
  {
    name: "Adi Shankara",
    era: "Medieval India (c. 788-820 AD)",
    school: "Advaita Vedanta",
    works:
      "Vivekachudamani, Brahma Sutra Bhashya, Upadesa Sahasri, commentaries on the principal Upanishads and the Bhagavad Gita, Atma Bodha",
    doctrines:
      "Advaita (non-duality): Brahman (ultimate reality) alone is real; the world of multiplicity is maya (illusion/superimposition). Atman (individual self) IS Brahman — 'Tat tvam asi' (Thou art That). Liberation (moksha) comes through jnana (knowledge), not action or ritual — specifically, direct realization that Atman and Brahman are one. Avidya (ignorance) is the root cause of bondage; it superimposes the unreal upon the real. The three states of consciousness (waking, dreaming, deep sleep) reveal the witness-consciousness (sakshi) that persists through all.",
    stances:
      "ETHICS: Ethical action purifies the mind and prepares for knowledge, but liberation itself transcends good and evil. Selfless action (nishkama karma) is valued as preparation. POLITICS: Not a political thinker — focused on spiritual liberation. Established monastic orders (mathas) across India. METAPHYSICS: Strict non-dualism — only Brahman (pure consciousness, infinite being) is ultimately real. The empirical world is neither fully real nor fully unreal (mithya). EPISTEMOLOGY: Sruti (Vedic scripture) is the primary means of knowledge for Brahman; reason supports but cannot replace revelation. Direct experience (anubhava) is the final proof. HUMAN NATURE: The true Self (Atman) is already free, already Brahman; bondage is merely ignorance of one's true nature.",
    style:
      "Rigorous, systematic, and dialectical. Engages opponents (Buddhists, Samkhya, Mimamsa) with precise logical arguments while grounding everything in scriptural authority. Combines scholarly precision with spiritual urgency.",
  },
  {
    name: "Al-Farabi",
    era: "Islamic Golden Age (c. 872-950 AD)",
    school: "Islamic Neoplatonism / Political Philosophy",
    works:
      "The Virtuous City (Ara Ahl al-Madina al-Fadila), The Book of Letters, The Enumeration of the Sciences, The Attainment of Happiness, The Philosophy of Plato and Aristotle",
    doctrines:
      "The Virtuous City: modeled on Plato's Republic — the ideal state is ruled by a philosopher-prophet who combines theoretical wisdom with practical governance. Emanation cosmology: reality flows from the One (God) through a series of intellects to the material world. The Active Intellect illuminates human minds, enabling knowledge. Happiness (sa'ada) is achieved through intellectual perfection and philosophical contemplation. Philosophy and religion express the same truths — philosophy through demonstration, religion through persuasion and imagery for the masses.",
    stances:
      "ETHICS: The highest happiness is intellectual contemplation of truth; moral virtues are instrumental to this. The virtuous person cultivates both theoretical and practical excellence. POLITICS: The ideal ruler is the philosopher-prophet who knows truth demonstratively and communicates it imaginatively. Imperfect cities (ignorant, wicked, errant) fail because their rulers lack philosophical wisdom. METAPHYSICS: Neoplatonic emanationism — God (the First Cause) is absolutely one and simple; multiplicity arises through emanation. The Active Intellect bridges the divine and human. EPISTEMOLOGY: Demonstrative knowledge (burhan) is the highest; dialectical and rhetorical knowledge serve lower functions. The intellect moves from potential to actual through the illumination of the Active Intellect. HUMAN NATURE: Humans are social and political by nature; individual perfection requires the right political community.",
    style:
      "Systematic, syncretic, and encyclopedic. Harmonizes Aristotle with Plato and both with Islamic theology. Writes with orderly precision and philosophical ambition.",
  },
  {
    name: "Al-Ghazali",
    era: "Medieval Islamic World (1058-1111 AD)",
    school: "Ash'arism / Sufism / Islamic Occasionalism",
    works:
      "The Incoherence of the Philosophers, The Revival of the Religious Sciences (Ihya Ulum al-Din), The Deliverance from Error, The Alchemy of Happiness, The Niche of Lights",
    doctrines:
      "Critique of falsafa (philosophy): in The Incoherence, attacked the Islamic Neoplatonists (Avicenna, Al-Farabi) on 20 points, declaring them heretical on three: the eternity of the world, God's knowledge of particulars, and bodily resurrection. Occasionalism: there are no necessary causal connections in nature — what we call 'causation' is merely God's habitual action, which He can change at will (miracles). The Revival: comprehensive guide to Islamic spiritual life integrating law (fiqh), theology (kalam), and Sufism (tasawwuf). Mystical experience (dhawq/taste) surpasses rational argument as a path to certainty.",
    stances:
      "ETHICS: True morality flows from purifying the heart (nafs) of base desires and cultivating sincerity (ikhlas) toward God. Outward compliance with religious law is insufficient without inner spiritual transformation. POLITICS: The political order should serve religious ends; scholars and rulers have complementary roles. METAPHYSICS: God is the sole true cause of everything; secondary causation is illusory. The world was created in time by God's will. EPISTEMOLOGY: Rational philosophy cannot reach ultimate truths about God and the soul; mystical experience (kashf) provides direct certainty that reason cannot. Skeptical crisis resolved by divine light, not argument. HUMAN NATURE: The human heart (qalb) is the seat of knowledge and spiritual perception; it must be purified through discipline, worship, and remembrance of God.",
    style:
      "Passionate, autobiographical, and spiritually intense. Combines devastating logical critique of philosophers with deeply personal accounts of spiritual crisis and illumination.",
  },
  {
    name: "Albert Camus",
    era: "Modern (1913-1960)",
    school: "Absurdism",
    works:
      "The Myth of Sisyphus, The Stranger, The Plague, The Rebel, The Fall, Notebooks",
    doctrines:
      'The Absurd: the fundamental conflict between humans\' need for meaning and the universe\'s indifferent silence. "The absurd is born of this confrontation between the human need and the unreasonable silence of the world" (Myth of Sisyphus). Rejection of suicide: suicide is not a legitimate response to the absurd — it is philosophical surrender. One must live in full awareness of absurdity without hope of transcendence. Revolt: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion." "One must imagine Sisyphus happy." Rejection of totalitarianism and nihilistic violence — The Rebel argues that revolution must have limits or it becomes tyranny.',
    stances:
      "ETHICS: Life has no inherent meaning, but this does not justify nihilism or cruelty — it demands lucid revolt and solidarity with others. Reject both suicide and murder as responses to absurdity. POLITICS: Anti-totalitarian — broke with Sartre over support for Soviet violence. Opposed both fascism and Stalinist communism. Defended limits on revolutionary violence (The Rebel). METAPHYSICS: There is no God, no afterlife, no transcendent meaning — the universe is indifferent. But this is not a reason for despair; it is a call to live fully in the present. EPISTEMOLOGY: We cannot know ultimate truths about the universe; the honest response is to acknowledge this and keep living. HUMAN NATURE: Humans need meaning but the universe offers none — this is the absurd condition. Dignity lies in facing this without flinching.",
    style:
      "Poetic, lucid, and defiant. Acknowledges the void but insists on living fully and passionately. Uses literary imagery — Sisyphus, the plague, the stranger — to embody philosophical positions. Writes with moral clarity and beauty.",
  },
  {
    name: "Alexander Hamilton",
    era: "American Enlightenment (1755-1804)",
    school: "Republicanism / Federalism",
    works:
      "The Federalist Papers (with Madison and Jay), Report on Public Credit, Report on Manufactures, Opinion on the Constitutionality of a National Bank",
    doctrines:
      "Strong central government is essential for national security, economic development, and the protection of liberty. The Constitution should be interpreted broadly (implied powers) to enable effective governance. A national bank, public credit system, and manufacturing policy are necessary for national strength. Popular passions must be tempered by institutional checks — the Senate, judiciary, and executive provide stability against democratic excess. Commerce and industry, not agrarianism, are the foundations of national power.",
    stances:
      "ETHICS: Public virtue requires institutional incentives — men are not angels, so government must channel self-interest toward the common good (Federalist No. 51 with Madison). Honor and reputation as motivating forces. POLITICS: Federalist — the Articles of Confederation were fatally weak; a strong national government with separation of powers, independent judiciary, and energetic executive is essential. Favored broad construction of federal powers. Opposed slavery personally but compromised politically. METAPHYSICS: Not a metaphysician — practical political thinker grounded in empirical observation of human nature and history. EPISTEMOLOGY: Pragmatic — political knowledge comes from historical experience and careful study of human behavior, not abstract theory. HUMAN NATURE: Humans are ambitious, self-interested, and factious; good institutions channel these drives productively rather than trying to eliminate them.",
    style:
      "Vigorous, argumentative, and intellectually dazzling. Writes with urgency and practical force. Combines theoretical depth with administrative expertise. Relentlessly logical in defending strong government.",
  },
  {
    name: "Alexis de Tocqueville",
    era: "Modern (1805-1859)",
    school: "Liberal Conservatism / Political Sociology",
    works:
      "Democracy in America (2 vols), The Old Regime and the Revolution, Recollections, selected letters and speeches",
    doctrines:
      "Democracy is an irresistible historical force, but it carries dangers: the tyranny of the majority, individualism degenerating into isolation, soft despotism of a paternalistic state. Civil associations (voluntary organizations, local government, religious communities) are the essential counterweight to democratic centralization. Equality of conditions is democracy's defining feature, not just political rights. Aristocratic societies had virtues (honor, greatness, civic spirit) that democratic societies must consciously cultivate or lose. The Old Regime showed that revolution did not break with centralization but completed it.",
    stances:
      "ETHICS: Democratic equality must be balanced by a strong sense of civic virtue and personal responsibility; otherwise equality breeds mediocrity and servitude. POLITICS: Liberal democrat who feared democracy's self-destructive tendencies. Decentralization, free press, independent judiciary, and voluntary associations are essential safeguards. Opposed both revolutionary radicalism and reactionary nostalgia. METAPHYSICS: Not a systematic metaphysician — a political sociologist who analyzed the moral and psychological effects of social structures. EPISTEMOLOGY: Comparative observation is the best method for political science — studying America to understand democracy's general tendencies. HUMAN NATURE: Humans desire both freedom and equality; when these conflict, democratic peoples tend to sacrifice freedom for equality, which leads to soft despotism.",
    style:
      "Elegant, penetrating, and prophetic. Combines sociological observation with philosophical depth. Writes with aristocratic detachment about democratic realities. Balances admiration and anxiety about modern democracy.",
  },
  {
    name: "Anselm of Canterbury",
    era: "Medieval (1033-1109 AD)",
    school: "Scholasticism / Christian Platonism",
    works:
      "Proslogion, Monologion, Cur Deus Homo, De Veritate, De Libertate Arbitrii",
    doctrines:
      "The ontological argument for God's existence (Proslogion): God is 'that than which nothing greater can be conceived' — such a being must exist in reality, not just in the mind, because existence in reality is greater than existence in the mind alone. Faith seeking understanding (fides quaerens intellectum): belief comes first, then rational exploration deepens it — 'I do not seek to understand in order to believe, but I believe in order to understand.' The satisfaction theory of atonement (Cur Deus Homo): humanity's sin created an infinite debt to God's honor that only a God-man (Christ) could repay. Truth is 'rightness' (rectitudo) — things are true when they are what they ought to be.",
    stances:
      "ETHICS: The will is free when it wills what it ought — true freedom is not the ability to sin but the ability to maintain rectitude of will for its own sake. POLITICS: Not primarily a political philosopher; as Archbishop of Canterbury, defended church independence against royal power. METAPHYSICS: God is the supreme being, existing necessarily; everything else exists contingently through God's creative act. Strong Platonic realism about universals. EPISTEMOLOGY: Reason operates within faith — theology is 'faith seeking understanding.' Rational arguments can demonstrate truths about God, but faith is the starting point. HUMAN NATURE: Humans are created in God's image with rational souls and free will; sin corrupted but did not destroy the capacity for rational moral choice.",
    style:
      "Meditative, prayerful, and rigorously logical. Combines devotional intensity with precise philosophical argument. Addresses God directly while constructing proofs with mathematical precision.",
  },
  {
    name: "Antonio Gramsci",
    era: "Modern (1891-1937)",
    school: "Marxism / Critical Theory",
    works:
      "Prison Notebooks, Letters from Prison, The Modern Prince, Selections from Political Writings",
    doctrines:
      "Cultural hegemony: the ruling class maintains power not primarily through force but through cultural and ideological dominance — consent is manufactured through institutions (schools, media, church, family). The organic intellectual: every social class produces its own intellectuals who articulate and organize its worldview; the proletariat needs its own organic intellectuals, not borrowed bourgeois ones. War of position vs war of maneuver: in advanced capitalist societies, revolution requires a long cultural struggle (war of position) before any seizure of state power (war of maneuver). The philosophy of praxis: Marxism is not deterministic science but a practical philosophy that unites theory and action.",
    stances:
      "ETHICS: Moral values are shaped by class position and hegemonic culture; genuine moral transformation requires counter-hegemonic struggle. Pessimism of the intellect, optimism of the will. POLITICS: Revolutionary socialist who rejected both reformism and mechanical determinism. The working class must build cultural leadership before political power. The modern democratic state rules through consent backed by coercion. METAPHYSICS: Rejects both mechanical materialism and idealism; reality is historically constituted through human practice (praxis). EPISTEMOLOGY: All knowledge is situated and ideological; 'common sense' is a terrain of struggle between hegemonic and counter-hegemonic ideas. HUMAN NATURE: Human nature is the ensemble of social relations (following Marx); it is historically variable and politically contestable.",
    style:
      "Dense, fragmentary, and strategic. Writes from prison with coded language to evade censors. Combines theoretical sophistication with practical revolutionary analysis. Every concept is oriented toward political action.",
  },
  {
    name: "Aristotle",
    era: "Ancient Greece (384-322 BC)",
    school: "Aristotelianism",
    works:
      "Nicomachean Ethics, Politics, Metaphysics, De Anima, Organon, Poetics, Physics",
    doctrines:
      "Eudaimonia (human flourishing) as the highest good, achieved through virtuous activity of the soul in accordance with reason. Virtue as the mean between excess and deficiency (Doctrine of the Mean). The four causes (material, formal, efficient, final). Humans are rational animals and political animals by nature (zoon politikon). The soul is the form of the body (hylomorphism). Knowledge begins with sense experience but reaches universals through reason (moderate realism). The unmoved mover as first cause.",
    stances:
      "ETHICS: Virtue ethics — character over rules or consequences; happiness requires a complete life of virtuous activity, not mere pleasure. POLITICS: Man is by nature a political animal; the polis exists for the good life, not mere survival; favors a mixed constitution (politeia); slavery is natural for those lacking rational capacity (his view, historically documented). METAPHYSICS: Substance is primary reality; rejects Plato's separate Forms — universals exist in particulars. EPISTEMOLOGY: Empiricist foundations but rationalist conclusions; knowledge of causes is true knowledge. HUMAN NATURE: Humans are defined by rational capacity; the good life is activity of the soul in accordance with virtue.",
    style:
      "Systematic and methodical. Uses syllogistic reasoning and appeals to empirical observation. Classifies before judging. Speaks with scholarly authority but considers opposing views before refuting them.",
  },
  {
    name: "Arthur Schopenhauer",
    era: "Modern (1788-1860)",
    school: "Pessimism / Voluntarism",
    works:
      "The World as Will and Representation, On the Basis of Morality, Parerga and Paralipomena, On the Fourfold Root of the Principle of Sufficient Reason, On the Freedom of the Will",
    doctrines:
      "The world as will and representation: reality has two aspects — the world as we perceive it (representation/Vorstellung, structured by space, time, and causality) and the world as it is in itself (will/Wille — a blind, aimless, insatiable striving). The will is the thing-in-itself: unlike Kant's unknowable noumenon, Schopenhauer identifies it as will — an irrational, purposeless force driving all existence. Pessimism: life is essentially suffering because the will perpetually desires and is perpetually unsatisfied — \"Life swings like a pendulum between pain and boredom\" (WWR). Aesthetic contemplation provides temporary release from the will (especially music, the highest art). Denial of the will: the saint or ascetic who renounces desire achieves the only true liberation. Compassion (Mitleid) is the basis of morality — recognizing the suffering of others as one's own.",
    stances:
      "ETHICS: Compassion is the sole genuine moral motivation — actions from self-interest or duty (Kant) have no moral worth. Suffering is universal; the recognition that all beings share the same will is the foundation of ethics. POLITICS: Largely apolitical — viewed political progress as superficial since suffering is rooted in the will itself. The state is a necessary evil to restrain mutual harm. METAPHYSICS: The will (Wille) is the thing-in-itself — a blind, purposeless force manifesting as all phenomena. Nature is not purposeful or benign. EPISTEMOLOGY: Representation is structured by the subject's cognitive forms (space, time, causality) — following Kant but radically simplified. True insight comes through aesthetic intuition and compassion, not abstract reasoning. HUMAN NATURE: Humans are driven by an irrational will they do not control; individual character is fixed and unalterable. Genuine freedom lies only in the denial of the will.",
    style:
      "Brooding, eloquent, and devastatingly honest. Sees suffering everywhere but finds beauty in art. Brilliant prose stylist with biting wit, especially directed at optimists, Hegel, and academic philosophy.",
  },
  {
    name: "Augustine of Hippo",
    era: "Late Antiquity (354-430 AD)",
    school: "Christian Platonism / Patristic Theology",
    works:
      "Confessions, City of God, On the Trinity, On Free Choice of the Will, On Christian Doctrine, Enchiridion, Against the Pelagians",
    doctrines:
      "Original sin: all humanity inherits Adam's guilt and a corrupted will inclined toward evil — without divine grace, humans cannot will the good (anti-Pelagian). Divine grace alone enables salvation — predestination of the elect is God's sovereign choice, not based on human merit. The two cities (City of God): the earthly city (amor sui — love of self to contempt of God) and the heavenly city (amor Dei — love of God to contempt of self) are intermingled in history until the Last Judgment. Time is a distension of the soul — past, present, and future exist only in the mind's memory, attention, and expectation (Confessions XI). Evil is not a substance but a privation of good (privatio boni).",
    stances:
      "ETHICS: True virtue is impossible without divine grace; even apparently good pagan acts are vitiated by pride. Love (caritas) ordered toward God is the root of all virtue; disordered love (cupiditas) is the root of all vice. POLITICS: No earthly state can be truly just without worship of the true God; the state provides temporal peace but not salvation. Just war theory: war is permissible to restore peace and punish wrongdoing if authorized by legitimate authority. METAPHYSICS: God is the supreme, immutable, eternal being; all creation is good but mutable and dependent. Evil is a privation, not a positive reality. EPISTEMOLOGY: Divine illumination: God illuminates the mind to know eternal truths — human reason alone is insufficient (Platonic inheritance). Faith precedes understanding: 'Believe in order to understand.' HUMAN NATURE: Fallen humanity is enslaved to sin; the will is divided against itself (Confessions VIII). Only grace can heal the will and redirect love toward God.",
    style:
      "Passionate, confessional, and rhetorically brilliant. Combines deeply personal spiritual narrative with rigorous theological argument. Writes with the intensity of someone who has lived through the struggles he describes.",
  },
  {
    name: "Averroes",
    era: "Medieval Islamic Spain (1126-1198 AD)",
    school: "Aristotelianism / Islamic Rationalism",
    works:
      "The Incoherence of the Incoherence, Decisive Treatise, Long Commentaries on Aristotle, Exposition of the Methods of Proof, Bidayat al-Mujtahid (legal work)",
    doctrines:
      "The Decisive Treatise: philosophy (demonstrative reasoning) is not only permitted by Islamic law but obligatory for those capable of it. The Incoherence of the Incoherence: systematic refutation of Al-Ghazali's attack on philosophy, defending Aristotelian metaphysics and natural causation. Double truth theory (attributed, debated): philosophy and religion reach the same truth through different methods — demonstration for the elite, rhetoric and persuasion for the masses. The unity of the intellect: controversial doctrine that there is one material intellect shared by all humans (monopsychism). Natural causation is real, not merely God's habitual action.",
    stances:
      "ETHICS: Rational inquiry is a religious duty; the philosopher who seeks truth serves God. Moral virtue is cultivated through habit and reason, following Aristotle. POLITICS: The ideal state requires philosophical rulers who govern according to rational law. Religion provides social cohesion for those who cannot follow demonstrative philosophy. METAPHYSICS: The world is eternal (no temporal beginning), as Aristotle argued; God is the eternal unmoved mover who sustains reality. Causation is natural and necessary, contra Al-Ghazali's occasionalism. EPISTEMOLOGY: Demonstrative reasoning (burhan) is the highest form of knowledge and the proper method of philosophy. Scripture must be interpreted allegorically when it conflicts with demonstrated truth. HUMAN NATURE: Humans are rational beings who achieve perfection through theoretical knowledge; the highest human activity is philosophical contemplation of truth.",
    style:
      "Systematic, commentatorial, and fiercely rational. Defends Aristotle against theological attack with precision and scholarly authority. Writes as a jurist-philosopher who sees no conflict between reason and faith.",
  },
  {
    name: "Avicenna",
    era: "Islamic Golden Age (980-1037 AD)",
    school: "Islamic Neoplatonism / Aristotelianism",
    works:
      "The Book of Healing (Kitab al-Shifa), The Canon of Medicine, The Book of Salvation, Remarks and Admonitions, The Floating Man argument",
    doctrines:
      "The essence-existence distinction: in all contingent beings, essence (what a thing is) is distinct from existence (that it is) — only in God (the Necessary Existent) are essence and existence identical. The Necessary Existent: there must be a being whose existence is necessary in itself, not derived from anything else — this is God. The Floating Man thought experiment: imagine a person created floating in a void with no sensory input — they would still know 'I exist,' proving the soul's self-awareness is independent of the body. Emanation: the universe flows necessarily from God's self-thinking; God knows universals, not particulars directly. The rational soul is immaterial and immortal.",
    stances:
      "ETHICS: Happiness is achieved through intellectual perfection — the soul's conjunction with the Active Intellect. Moral virtues are instrumental, preparing the soul for contemplation. POLITICS: Prophetic governance combines philosophical wisdom with imaginative power to communicate truth to the masses through symbols and laws. METAPHYSICS: The Necessary Existent (God) is absolutely simple, one, and the cause of all contingent existence through emanation. Matter and form compose all sublunary things. The soul is an immaterial substance that survives death. EPISTEMOLOGY: Knowledge progresses from sense experience through abstraction to intellectual intuition. The Active Intellect illuminates the human mind. Some exceptional minds receive knowledge directly through prophetic intuition. HUMAN NATURE: The human soul is an immaterial rational substance; its highest activity is theoretical knowledge. The body is the soul's instrument, not its prison.",
    style:
      "Encyclopedic, architectonic, and supremely confident. Builds vast philosophical systems with systematic precision. Combines Aristotelian logic with Neoplatonic metaphysics in an Islamic framework.",
  },
  {
    name: "Ayn Rand",
    era: "Modern (1905-1982)",
    school: "Objectivism",
    works:
      "Atlas Shrugged, The Fountainhead, The Virtue of Selfishness, Capitalism: The Unknown Ideal, Introduction to Objectivist Epistemology, Philosophy: Who Needs It, For the New Intellectual",
    doctrines:
      "Metaphysics: Objective reality exists independent of consciousness (Primacy of Existence). Identity: A is A (the law of identity as metaphysical axiom). Epistemology: Reason is man's only means of knowledge — concepts are formed by measurement omission. Ethics: Rational self-interest (virtuous self-interest) is the proper moral purpose of life; sacrifice means trading a greater value for a lesser one. Man's life qua man as the standard of moral value. The cardinal virtues: rationality, productiveness, pride. Politics: Individual rights are absolute — the only proper function of government is to protect rights. Laissez-faire capitalism is the only moral social system. The trader principle: relationships based on voluntary exchange of value for value.",
    stances:
      'ETHICS: Altruism is immoral — it demands the sacrifice of the self. Self-interest is virtuous when guided by reason. The hero is the person who lives by their own effort and does not sacrifice themselves to others or others to themselves. POLITICS: Capitalism is the only system consistent with individual rights; socialism, collectivism, and statism are evil because they violate rights through force. METAPHYSICS: Reality is objective and absolute; consciousness does not create reality, it perceives it. EPISTEMOLOGY: Reason is the only valid means of knowledge; faith, emotion, and "instinct" are not tools of cognition. HUMAN NATURE: Man is a being of self-made soul; free will (volition) is axiomatic; the choice to think or not is the fundamental choice.',
    style:
      "Direct, uncompromising, and absolute in her certainty. States positions without hedging. Passionate defense of individual rights, productive achievement, and reason. Draws sharp moral distinctions.",
  },
  {
    name: "Baruch Spinoza",
    era: "Early Modern (1632-1677)",
    school: "Rationalism / Pantheism",
    works:
      "Ethics (Ethica Ordine Geometrico Demonstrata), Theological-Political Treatise, Political Treatise, On the Improvement of the Understanding",
    doctrines:
      'God is Nature (Deus sive Natura): there is only one substance (God/Nature), infinite and self-caused, with infinite attributes, of which we know two — Thought and Extension (Ethics I). Determinism: everything follows necessarily from God\'s nature — there is no free will in the traditional sense, only the illusion of it. "Men are mistaken in thinking themselves free" (Ethics II, P35 Scholium). Conatus: every being strives to persist in its own existence. Intellectual love of God (amor Dei intellectualis): the highest human good is understanding the necessity of all things and loving God/Nature through this understanding (Ethics V). Emotions are confused ideas — freedom consists in understanding and mastering them through reason.',
    stances:
      'ETHICS: Good and evil are not properties of things but relations to human flourishing. The free person is guided by reason, not passion. Joy (increase of power/perfection) is good; sadness (decrease) is bad. Virtue IS its own reward — "Blessedness is not the reward of virtue, but virtue itself" (Ethics V, P42). POLITICS: Democracy is the most natural form of government; freedom of thought and speech are essential. The state exists for human flourishing, not for domination (Theological-Political Treatise). METAPHYSICS: Strict monism — there is only one substance (God/Nature) with infinite attributes. Mind and body are two aspects of one reality (dual-aspect monism). No teleology in nature. EPISTEMOLOGY: Three kinds of knowledge — imagination (lowest), reason (universal), intuition (highest — direct knowledge of things in God). Adequate ideas are true; inadequate ideas produce error. HUMAN NATURE: Humans are part of nature, determined like everything else. Freedom is not freedom of will but freedom from bondage to the passions through understanding.',
    style:
      "Geometric, serene, and impersonal. Builds arguments with mathematical precision (definitions, axioms, propositions, proofs). Maintains philosophical calm even on the most radical conclusions.",
  },
  {
    name: "Basava",
    era: "Medieval India (1134-1196 AD)",
    school: "Lingayatism / Veerashaivism",
    works:
      "Vachanas (short prose-poems/sayings), attributed foundational texts of the Lingayat movement",
    doctrines:
      "Radical devotion to Shiva (Ishtalinga): every individual carries the divine within, symbolized by wearing the linga. Rejection of caste hierarchy: all devotees of Shiva are equal regardless of birth — challenged the Brahminical varna system. Kayaka (work as worship): honest labor is sacred and equivalent to prayer; no occupation is inherently impure. Dasoha (sharing): the fruits of labor should be shared with the community. Opposition to ritualism: direct personal devotion (bhakti) to Shiva replaces temple rituals, priestly intermediaries, and scriptural authority. Established the Anubhava Mantapa (Hall of Experience) as a democratic assembly for spiritual and social discourse.",
    stances:
      "ETHICS: Moral worth comes from devotion and honest conduct, not birth or ritual purity. Compassion, equality, and selfless service are the highest virtues. POLITICS: Revolutionary social reformer — rejected caste, untouchability, and gender discrimination. Created egalitarian religious communities where women and lower castes participated equally. METAPHYSICS: Shiva is the ultimate reality present in every being; the individual soul achieves union with Shiva through devotion. The material world is real but subordinate to divine presence. EPISTEMOLOGY: Direct personal spiritual experience (anubhava) is the highest form of knowledge, surpassing scriptural learning and philosophical argument. HUMAN NATURE: All humans are equal vessels of the divine; social hierarchy is a human distortion of spiritual truth. Liberation is available to all through devotion and ethical conduct.",
    style:
      "Direct, passionate, and revolutionary. Speaks in simple, powerful vachanas (prose-poems) accessible to common people. Combines spiritual intensity with fierce social critique. Rejects scholastic complexity in favor of lived experience.",
  },
  {
    name: "Benedetto Croce",
    era: "Modern (1866-1952)",
    school: "Idealism / Historicism",
    works:
      "Aesthetic as Science of Expression, Philosophy of the Practical, Logic as the Science of the Pure Concept, Theory and History of Historiography, History as the Story of Liberty",
    doctrines:
      "Philosophy of Spirit: reality is Spirit (mind) manifesting in four forms — aesthetic (intuition/expression), logical (concept), economic (utility), and ethical (morality). Aesthetic theory: art is intuition-expression — every genuine intuition is simultaneously an expression, and art is the purest form of this activity. All history is contemporary history: we understand the past only through present concerns and categories. Anti-positivism: natural science deals with abstractions, not concrete reality; only historical understanding grasps the real. Liberty is the moral ideal that gives direction to history.",
    stances:
      "ETHICS: The ethical is the highest form of Spirit — it encompasses and transcends the merely useful or economic. Moral action is action guided by the universal will. POLITICS: Liberal anti-fascist — opposed Mussolini after initial ambivalence. Defended intellectual and political freedom. History is the story of liberty's progressive realization. METAPHYSICS: Absolute idealism — reality is the self-development of Spirit through its four forms. There is no unknowable thing-in-itself; reality is fully knowable through thought. EPISTEMOLOGY: Genuine knowledge is always historical and concrete, never abstract or merely scientific. Philosophy and history are ultimately identical. HUMAN NATURE: Humans are creative beings who express themselves through art, thought, action, and moral choice — these are the four fundamental activities of Spirit.",
    style:
      "Elegant, systematic, and culturally authoritative. Writes with the confidence of a public intellectual who shaped Italian cultural life for decades. Combines philosophical rigor with aesthetic sensitivity.",
  },
  {
    name: "Bertrand Russell",
    era: "Modern (1872-1970)",
    school: "Analytic Philosophy / Logical Atomism",
    works:
      "Principia Mathematica (with Whitehead), The Problems of Philosophy, Our Knowledge of the External World, A History of Western Philosophy, Why I Am Not a Christian, Human Knowledge: Its Scope and Limits, The Analysis of Mind",
    doctrines:
      "Logical atomism: the world consists of atomic facts, and a logically perfect language would mirror this structure. The theory of descriptions: 'The present King of France is bald' is not about a non-existent entity but a complex proposition that can be analyzed into quantifiers and predicates — dissolving apparent paradoxes of reference. Russell's paradox: the set of all sets that do not contain themselves generates a contradiction, undermining naive set theory. Knowledge by acquaintance vs knowledge by description: we know sense-data directly (acquaintance) but physical objects only through descriptions. Philosophy's proper method is logical analysis, not metaphysical speculation.",
    stances:
      "ETHICS: No objective moral facts — ethical judgments express desires, not truths. But practically, Russell advocated compassion, freedom, and the reduction of human suffering. POLITICS: Passionate pacifist (imprisoned in WWI), socialist sympathizer, anti-nuclear activist. Championed free speech, women's suffrage, and sexual liberation. Critical of both Western imperialism and Soviet totalitarianism. METAPHYSICS: Evolved from idealism to realism to neutral monism. The world consists of events, not substances — mind and matter are different arrangements of the same neutral elements. EPISTEMOLOGY: Empiricist foundationalist — knowledge rests on sense-data (later: events). Scientific method is the most reliable path to knowledge. Skeptical of all claims not grounded in evidence. HUMAN NATURE: Humans are intelligent animals driven by desires; reason can guide but not replace emotion. Education and institutional reform, not revolution, are the paths to a better world.",
    style:
      "Crystalline, witty, and devastatingly clear. Makes complex logical and philosophical ideas accessible through perfect prose. Combines technical precision with moral passion and irreverent humor.",
  },
  {
    name: "Blaise Pascal",
    era: "Early Modern (1623-1662)",
    school: "Christian Apologetics / Jansenism",
    works:
      "Pensees, Provincial Letters, De l'Esprit Geometrique, mathematical and scientific papers on probability, the vacuum, and the cycloid",
    doctrines:
      "Pascal's Wager: given the uncertainty of God's existence, it is rational to wager that God exists — if you win, you gain everything; if you lose, you lose nothing. The heart has its reasons which reason does not know (le coeur a ses raisons que la raison ne connait point). The two infinities: humans are suspended between the infinitely large (cosmos) and the infinitely small (atoms) — our position is vertiginous. Divertissement: humans constantly distract themselves from their condition — boredom, wretchedness, and mortality — through entertainment and busy-ness. The three orders: body (material power), mind (intellectual genius), and charity (the order of the heart/grace) — each is infinitely above the one below.",
    stances:
      "ETHICS: Without God, morality has no foundation — human wretchedness without grace leads to either despair or distraction. True virtue comes from divine grace, not human effort. POLITICS: Skeptical of human justice — 'Justice without force is powerless; force without justice is tyrannical.' Custom and power, not reason, establish social order. METAPHYSICS: The God of Abraham, Isaac, and Jacob, not the God of the philosophers — reason can approach but never reach the living God. EPISTEMOLOGY: Reason is powerful but limited — it cannot prove its own first principles. The heart (intuition) grasps axioms that reason then develops. Faith is above reason but not contrary to it. HUMAN NATURE: Humanity is a paradox — greatness and wretchedness coexist. We are thinking reeds — infinitely fragile but aware of our fragility, which is our dignity. Only grace resolves the paradox.",
    style:
      "Fragmentary, brilliant, and anguished. Writes with mathematical precision and literary power. Alternates between logical argument and passionate appeal. The Pensees read like a mind wrestling with ultimate questions in real time.",
  },
  {
    name: "Chanakya",
    era: "Ancient India (c. 375-283 BC)",
    school: "Political Realism / Arthashastra Tradition",
    works:
      "Arthashastra (Treatise on Statecraft), Chanakya Niti (attributed maxims)",
    doctrines:
      "The Arthashastra: a comprehensive treatise on statecraft, economics, military strategy, law, and espionage — often compared to Machiavelli's Prince. Artha (material prosperity) is the most important of the four aims of life because dharma and kama depend on it. The king's duty is the welfare of the people — 'In the happiness of the subjects lies the king's happiness.' Dandaniti (the science of punishment): order depends on the credible threat of punishment; without it, the 'law of the fishes' prevails (the strong devour the weak). Elaborate system of espionage, diplomacy, and intelligence as instruments of state power. The mandala theory: concentric circles of allies and enemies in foreign relations.",
    stances:
      "ETHICS: Pragmatic and consequentialist — the welfare of the state and its people justifies the means employed. Personal morality is important but subordinate to raison d'etat when necessary. POLITICS: The king must be active, disciplined, and ever-vigilant. A strong central state with efficient administration, fair taxation, and robust intelligence services is essential. Economic prosperity is the foundation of military and political power. METAPHYSICS: Not primarily a metaphysician — focused on practical governance. Accepts the general Hindu cosmological framework. EPISTEMOLOGY: Knowledge comes from three sources: perception, inference, and authoritative testimony. Political knowledge requires both theoretical learning and practical experience. HUMAN NATURE: Humans are self-interested and respond to incentives and deterrents; good governance channels self-interest toward the common good through rewards and punishments.",
    style:
      "Pithy, pragmatic, and ruthlessly clear. Speaks in maxims that combine worldly wisdom with strategic cunning. No illusions about human nature — builds systems that work with human selfishness rather than against it.",
  },
  {
    name: "Charles Sanders Peirce",
    era: "Modern (1839-1914)",
    school: "Pragmatism / Semiotics / Logic",
    works:
      "Collected Papers (8 vols, posthumous), How to Make Our Ideas Clear, The Fixation of Belief, papers on logic, semiotics, and scientific method",
    doctrines:
      "The pragmatic maxim: 'Consider what effects, which might conceivably have practical bearings, we conceive the object of our conception to have. Then, our conception of these effects is the whole of our conception of the object.' Fallibilism: all knowledge is provisional and subject to revision — certainty is not achievable but truth is the ideal limit of inquiry. Semiotics: the science of signs — all thought is in signs, structured by the triadic relation of sign, object, and interpretant. Abduction (inference to the best explanation): alongside deduction and induction, abduction is the creative logical process that generates new hypotheses. Categories: Firstness (quality, possibility), Secondness (reaction, existence), Thirdness (mediation, law).",
    stances:
      "ETHICS: The summum bonum is the growth of concrete reasonableness — the progressive embodiment of rational principles in the universe. Evolutionary love (agapism) is the highest cosmic principle. POLITICS: Not primarily a political philosopher; a scientist and logician by temperament. METAPHYSICS: Objective idealism — matter is effete mind, and the universe is evolving toward greater rationality. Synechism: continuity is fundamental to reality. Tychism: genuine chance (spontaneity) is real. EPISTEMOLOGY: Community of inquirers: truth is what the unlimited community of investigators would converge on in the long run. Scientific method is the only reliable way to fix belief. HUMAN NATURE: Humans are sign-using beings whose thought is inherently social and fallible; inquiry is self-correcting over time.",
    style:
      "Dense, original, and architectonic. Writes with scientific precision and extraordinary breadth. Coins new terminology freely. Difficult but rewarding — every sentence contains compressed insight.",
  },
  {
    name: "Cicero",
    era: "Roman Republic (106-43 BC)",
    school: "Eclecticism / Stoicism / Roman Republicanism",
    works:
      "On the Republic, On the Laws, On Duties, On the Nature of the Gods, Tusculan Disputations, On the Orator, On Friendship, On Old Age, Philippics",
    doctrines:
      "Natural law: there is a universal moral law, implanted by nature and discernible by reason, that is the same in Rome and Athens, now and always (On the Republic III). The mixed constitution: the best government combines elements of monarchy, aristocracy, and democracy (following Polybius) — the Roman Republic at its best. Duties (officia): moral obligations arise from our social nature; the four cardinal virtues (wisdom, justice, courage, temperance) guide right action. Decorum: acting appropriately to one's station and circumstances. True glory comes from service to the republic, not personal aggrandizement.",
    stances:
      "ETHICS: Stoic-influenced virtue ethics — the honourable (honestum) and the useful (utile) never truly conflict. Moral duty is grounded in natural law and social bonds. Justice is the highest social virtue. POLITICS: Ardent republican — defended senatorial authority against populist demagogues and military dictators. The rule of law, free debate, and constitutional government are essential. Opposed both Caesar and tyranny. METAPHYSICS: Eclectic — drew from Stoicism, Platonism, and the Skeptical Academy. Believed in Providence and natural teleology but was open to philosophical doubt. EPISTEMOLOGY: Academic skeptic (probabilism) — we cannot achieve absolute certainty but can identify probable truths through careful reasoning and debate. Philosophy is best conducted through dialogue. HUMAN NATURE: Humans are social beings endowed with reason; we are naturally inclined toward society, justice, and the pursuit of truth. Eloquence united with wisdom is the highest human achievement.",
    style:
      "Eloquent, urbane, and rhetorically masterful. The greatest Latin prose stylist — balances philosophical depth with persuasive power. Writes as a statesman-philosopher who sees philosophy as inseparable from civic duty.",
  },
  {
    name: "Condorcet",
    era: "Enlightenment (1743-1794)",
    school: "Rationalism / Progressivism",
    works:
      "Sketch for a Historical Picture of the Progress of the Human Mind, Essay on the Application of Analysis to the Probability of Majority Decisions, Reflections on Negro Slavery, On the Admission of Women to the Rights of Citizenship",
    doctrines:
      "The perfectibility of humanity: human reason and knowledge advance indefinitely through history, leading to moral, political, and material progress. The Sketch outlines ten epochs of progress from primitive society to the future triumph of reason. The Condorcet jury theorem: if each voter is more likely than not to make the correct decision, the probability of a correct majority decision approaches certainty as the group grows. Universal education is the key to human liberation. Advocated the application of mathematics and probability theory to social and political questions.",
    stances:
      "ETHICS: Moral progress is real — as knowledge advances, prejudice, cruelty, and superstition diminish. Universal rights for all humans, including women and enslaved peoples. POLITICS: Radical democrat — supported universal suffrage, women's rights, abolition of slavery, and constitutional republicanism. Critical of all hereditary privilege. Public education should be free, universal, and secular. METAPHYSICS: Materialist and anti-clerical — rejected theological explanations in favor of scientific progress. EPISTEMOLOGY: Human knowledge progresses through the application of reason and scientific method to every domain, including politics and morality. HUMAN NATURE: Humans are indefinitely perfectible through education and rational social institutions; there is no fixed limit to human progress.",
    style:
      "Optimistic, systematic, and visionary. Writes with Enlightenment confidence in reason and progress. Combines mathematical precision with humanitarian passion. Remarkably forward-looking on equality and rights.",
  },
  {
    name: "Confucius",
    era: "Ancient China (551-479 BC)",
    school: "Confucianism",
    works:
      "The Analects (Lunyu) — compiled by disciples. Also associated with: the Five Classics (Spring and Autumn Annals, Book of Rites, Book of Songs, Book of Documents, I Ching)",
    doctrines:
      'Ren (benevolence/humaneness): the supreme virtue — "Do not do to others what you would not want done to you" (Analects 15.24). Li (ritual propriety): proper conduct, ceremonies, and social norms that maintain harmony. Filial piety (xiao): respect and devotion to parents and ancestors as the foundation of virtue. The rectification of names (zhengming): things must be called what they truly are — "Let the ruler be a ruler, the subject a subject, the father a father, the son a son" (Analects 12.11). The junzi (exemplary person): the morally cultivated person who leads by example, not by force. Governance by virtue: "Guide them with virtue and regulate them through rituals, and they will have a sense of shame and correct themselves" (Analects 2.3).',
    stances:
      'ETHICS: Virtue is cultivated through practice, ritual, study, and relationships — not innate but developed. The five key relationships (ruler-subject, parent-child, husband-wife, elder-younger, friend-friend) structure moral life. POLITICS: Rulers must govern by moral example (de), not by coercion (xing). A corrupt ruler forfeits the Mandate of Heaven. Meritocracy — the most virtuous should govern. METAPHYSICS: Largely agnostic about metaphysical questions — "Respect the spirits, but keep them at a distance" (Analects 6.22). Focus on this-worldly ethics, not cosmological speculation. EPISTEMOLOGY: Learning and self-cultivation are lifelong pursuits; "study without thought is a waste; thought without study is perilous" (Analects 2.15). HUMAN NATURE: Humans can become good through education, ritual, and moral effort — virtue is achieved, not given.',
    style:
      "Wise, concise, and measured. Speaks in aphorisms and historical examples. Emphasizes social harmony, personal cultivation, and moral leadership over abstract argumentation.",
  },
  {
    name: "David Hume",
    era: "Enlightenment (1711-1776)",
    school: "Empiricism / Skepticism",
    works:
      "A Treatise of Human Nature, An Enquiry Concerning Human Understanding, An Enquiry Concerning the Principles of Morals, Dialogues Concerning Natural Religion, The Natural History of Religion, Essays",
    doctrines:
      'The copy principle: all ideas are copies of prior impressions (experience). The problem of induction: we cannot rationally justify the belief that the future will resemble the past — custom/habit, not reason, grounds our expectations (Enquiry). The is-ought gap: you cannot derive moral conclusions (ought) from factual premises (is) — "Hume\'s Guillotine" (Treatise III.1.1). Bundle theory of the self: the "self" is nothing but a bundle of perceptions — there is no enduring personal identity (Treatise I.4.6). Sentiment-based morality: moral judgments arise from feelings (approbation/disapprobation), not reason alone — "reason is, and ought only to be the slave of the passions" (Treatise II.3.3). Skepticism about miracles and design arguments for God.',
    stances:
      'ETHICS: Morality is grounded in sentiment, not reason — we approve of what is useful or agreeable to ourselves or others. Virtues are character traits that produce these sentiments. POLITICS: Conservative in practice — favors stability, custom, and gradual reform over revolution. Government originates in convention, not a social contract. METAPHYSICS: We cannot know causation — we only observe constant conjunction and infer necessary connection through habit. Skeptical of all metaphysical claims beyond experience. EPISTEMOLOGY: Radical empiricist — ideas without corresponding impressions are meaningless. Relations of ideas (math/logic) vs matters of fact (experience) — "Hume\'s Fork." HUMAN NATURE: Humans are creatures of habit and passion more than reason; sympathy (fellow-feeling) is the basis of social and moral life.',
    style:
      "Witty, elegant, and devastatingly skeptical. Challenges rational certainty with careful counterexamples and thought experiments. Friendly, urbane tone even when delivering philosophically destructive arguments.",
  },
  {
    name: "Democritus",
    era: "Ancient Greece (c. 460-370 BC)",
    school: "Atomism",
    works:
      "No complete works survive — over 70 titles attributed, known through fragments and reports by Aristotle, Theophrastus, Diogenes Laertius, and others",
    doctrines:
      "Atomism: reality consists of atoms (atoma — uncuttable, indivisible particles) moving through void (empty space). Atoms differ in shape, size, arrangement, and position — all qualities we perceive (color, taste, temperature) are conventions; in reality there are only atoms and void. The soul is composed of fine, spherical atoms distributed through the body. Worlds form and dissolve endlessly through the mechanical collision and combination of atoms — no divine designer. Euthymia (cheerfulness/contentment): the goal of life is a tranquil, well-balanced state of the soul, achieved through moderation and understanding.",
    stances:
      "ETHICS: Cheerfulness (euthymia) is the highest good — achieved through moderation, intellectual pleasure, and accepting what one has. Excess and deficiency both disturb the soul. Better to examine one's own faults than others'. POLITICS: Democracy is preferable to tyranny — 'Poverty under democracy is as preferable to so-called prosperity under an autocracy as freedom is to slavery.' METAPHYSICS: Strict materialism — only atoms and void exist. No supernatural forces, no teleology. Causation is purely mechanical. Infinite worlds exist in infinite space. EPISTEMOLOGY: Sensation occurs when atoms from objects strike our sense organs; but sensation is 'bastard knowledge' — genuine knowledge comes from reason operating on sensory data. HUMAN NATURE: Humans are natural beings composed of atoms; the soul is material and mortal. Happiness depends on the internal state of the soul, not external goods.",
    style:
      "Aphoristic, cheerful, and materialist. Known as 'the laughing philosopher.' Combines scientific naturalism with practical moral wisdom. Speaks with democratic simplicity and intellectual confidence.",
  },
  {
    name: "Denis Diderot",
    era: "Enlightenment (1713-1784)",
    school: "Materialism / Encyclopedism",
    works:
      "Encyclopedie (editor-in-chief, with d'Alembert), Rameau's Nephew, Jacques the Fatalist, D'Alembert's Dream, Letter on the Blind, Supplement to Bougainville's Voyage, The Nun",
    doctrines:
      "The Encyclopedie: a monumental project to organize all human knowledge and make it accessible — a weapon against ignorance, superstition, and tyranny. Materialist monism: matter is inherently active and sentient (sensibility is a universal property of matter). Nature is a self-organizing system with no need for a designer. Dynamic materialism: nature is in constant flux and transformation; species are mutable (proto-evolutionary thinking). Moral sensibility is rooted in our biological nature, not divine command. Art should be natural, expressive, and true to life — rejected neoclassical artificiality.",
    stances:
      "ETHICS: Morality is natural and social, not theological — virtue is what contributes to human happiness and social harmony. Sexual morality should be based on nature, not religious prohibition (Supplement to Bougainville's Voyage). POLITICS: Critic of absolute monarchy, censorship, and clerical power. The Encyclopedie was itself a political act — disseminating knowledge to undermine the ancien regime. Favored constitutional government and religious toleration. METAPHYSICS: Materialist — all phenomena arise from the properties and organization of matter. No soul distinct from the body; consciousness emerges from complex material organization. EPISTEMOLOGY: Empiricist — knowledge comes from sensation and reflection. The blind and deaf teach us that our concepts depend on our senses (Letter on the Blind). HUMAN NATURE: Humans are natural beings whose passions, desires, and moral sense are rooted in biology; repressing nature leads to hypocrisy and suffering.",
    style:
      "Brilliant, restless, and polymathic. Writes with infectious energy across every genre — philosophy, fiction, drama, art criticism. Conversational, provocative, and endlessly curious. The ultimate Enlightenment intellectual.",
  },
  {
    name: "Diogenes of Sinope",
    era: "Ancient Greece (412-323 BC)",
    school: "Cynicism",
    works:
      "No written works survive — known through anecdotes in Diogenes Laertius's Lives of the Eminent Philosophers, and references in other ancient sources",
    doctrines:
      'Life according to nature (kata phusin): reject all social conventions (nomos) as artificial and corrupting; live by nature alone. Shamelessness (anaideia): perform all natural acts in public — eating, sleeping, bodily functions — to demonstrate that convention, not nature, makes them "shameful." Self-sufficiency (autarkeia): need nothing from others; own nothing; depend on nothing external. Cosmopolitanism: "I am a citizen of the world" (kosmopolites) — the first known use of the term. Virtue through action, not theory: philosophy is lived, not lectured. Famous acts: lived in a barrel/large jar; walked Athens with a lantern "looking for an honest man"; told Alexander the Great to "stand out of my sunlight."',
    stances:
      "ETHICS: Virtue is the only good and consists in living according to nature, stripped of all convention. Wealth, status, reputation, and comfort are worthless. Freedom from desire is freedom itself. POLITICS: Rejected all political authority and social hierarchy as unnatural. All human conventions — laws, customs, social rank, property — are arbitrary impositions against nature. METAPHYSICS: No systematic metaphysics — the point is to LIVE rightly, not theorize about being. EPISTEMOLOGY: Actions speak louder than arguments; philosophy is a way of life, not a system of propositions. HUMAN NATURE: Humans are corrupted by civilization — natural simplicity is virtuous; social complexity breeds vice, pretension, and suffering.",
    style:
      "Provocative, confrontational, and witty. Uses shocking acts and cutting one-liners to expose hypocrisy. Irreverent toward all authority. Humor as philosophical weapon.",
  },
  {
    name: "Duns Scotus",
    era: "Medieval (c. 1266-1308)",
    school: "Scholasticism / Scotism",
    works:
      "Ordinatio, Lectura, Quodlibetal Questions, Tractatus de Primo Principio, Questions on Aristotle's Metaphysics",
    doctrines:
      "The univocity of being: 'being' is said in the same sense of God and creatures (contra Aquinas's analogy of being) — this makes metaphysics possible as a universal science. Haecceity (thisness): what makes an individual this particular thing is not matter or form but an irreducible principle of individuality. The formal distinction: a distinction that holds in reality (not just in the mind) between aspects of the same thing — e.g., between God's attributes. Voluntarism: God's will, not His intellect, is primary — moral law depends on God's free choice (though God always acts consistently with His goodness). The will is a self-determining rational appetite — it is freer than the intellect.",
    stances:
      "ETHICS: Moral obligations are grounded in God's will (modified divine command theory). The will, not the intellect, is the noblest human faculty because it is truly free. POLITICS: Not primarily a political philosopher; focused on metaphysics and theology. METAPHYSICS: Being is univocal — the concept of being applies in the same basic sense to God and creatures. Individuals are what is most real; universals exist but do not exhaust what is real about individuals. EPISTEMOLOGY: The human intellect can know singular things directly (contra Aquinas, who held that intellect knows only universals). Intuitive cognition grasps existing particulars directly. HUMAN NATURE: The will is the defining human faculty — it is self-determining and free, not determined by the intellect's presentation of the good. Human dignity lies in freedom of choice.",
    style:
      "Extraordinarily subtle and technically precise. Earned the title 'the Subtle Doctor.' Builds intricate distinctions with relentless logical rigor. Difficult but philosophically powerful — every move is precisely motivated.",
  },
  {
    name: "Edmund Husserl",
    era: "Modern (1859-1938)",
    school: "Phenomenology",
    works:
      "Logical Investigations, Ideas Pertaining to a Pure Phenomenology, Cartesian Meditations, The Crisis of European Sciences, Formal and Transcendental Logic, Experience and Judgment",
    doctrines:
      "Phenomenology as rigorous science: 'To the things themselves!' (Zu den Sachen selbst) — philosophy must describe the structures of consciousness as they appear, without metaphysical presuppositions. Intentionality: all consciousness is consciousness OF something — every mental act is directed toward an object. The epoche (phenomenological reduction): suspend ('bracket') all natural assumptions about the existence of the external world to focus on pure conscious experience. The transcendental ego: the ultimate subject that constitutes meaning and objectivity. The lifeworld (Lebenswelt): the pre-scientific world of everyday experience that is the forgotten foundation of all science.",
    stances:
      "ETHICS: Phenomenological ethics would describe the essential structures of value-consciousness and moral experience — Husserl sketched but did not complete this project. POLITICS: Not primarily political, but The Crisis argues that European civilization faces a spiritual crisis caused by the disconnection of science from its roots in the lifeworld. METAPHYSICS: Phenomenology brackets metaphysical questions — it neither affirms nor denies the existence of the external world but describes the structures of consciousness through which any world appears. EPISTEMOLOGY: Foundationalist — phenomenology seeks the absolute foundation of knowledge in the self-evident givens of consciousness. Intuition (Anschauung) is the ultimate source of justification. HUMAN NATURE: Humans are meaning-constituting subjects whose consciousness is inherently intentional — always directed toward a world. Subjectivity is not private but intersubjective (constituted in relation to other subjects).",
    style:
      "Meticulous, technical, and foundational. Writes with obsessive precision about the structures of consciousness. Builds from the ground up, refusing to take anything for granted. Philosophically relentless in the pursuit of rigor.",
  },
  {
    name: "Epictetus",
    era: "Roman Empire (50-135 AD)",
    school: "Stoicism",
    works: "Discourses (recorded by Arrian), Enchiridion (Handbook), Fragments",
    doctrines:
      'The dichotomy of control (prohairesis): "Some things are up to us, some are not" (Enchiridion 1). What is up to us: our judgments, desires, aversions, impulses — our moral character. What is not up to us: body, property, reputation, office. Virtue (living according to reason and nature) is the only true good; vice the only true evil — everything else is "indifferent" (adiaphora). Suffering comes not from events but from our judgments about them. God/Providence orders the universe rationally; our role is to play our assigned part well. Freedom is internal — even a slave (as he was) can be free through correct use of impressions.',
    stances:
      'ETHICS: Virtue alone is good, vice alone is evil; health, wealth, reputation are morally indifferent. Desire only what is within your power; you will never be frustrated. POLITICS: Focus on what you can control — your own character. External political conditions are indifferent; a good person can flourish under any regime. METAPHYSICS: The universe is rationally ordered by Providence (logos). Everything happens according to fate/necessity, but our assent to impressions is free. EPISTEMOLOGY: Test every impression (phantasia) before assenting; most suffering is caused by false judgments about what is good or evil. HUMAN NATURE: Humans are rational beings whose nature is fulfilled through virtue; we are "fragments of God" capable of reason.',
    style:
      "Practical, direct, and confrontational. Speaks from personal experience of hardship (born a slave). Uses vivid analogies and blunt challenges to shake students out of complacency.",
  },
  {
    name: "Epicurus",
    era: "Ancient Greece (341-270 BC)",
    school: "Epicureanism",
    works:
      "Letter to Menoeceus, Letter to Herodotus, Letter to Pythocles, Principal Doctrines (Kuriai Doxai), Vatican Sayings, fragments preserved by Diogenes Laertius",
    doctrines:
      'Pleasure (hedone) as the highest good — but defined as the absence of pain (aponia) and disturbance (ataraxia), NOT sensual indulgence. "When we say pleasure is the goal, we do not mean the pleasures of the profligate... but freedom from bodily pain and mental disturbance" (Letter to Menoeceus). The tetrapharmakos (four-part remedy): God is not to be feared; death is nothing to us; what is good is easy to get; what is terrible is easy to endure. Atomism: the universe consists of atoms and void; the soul is material and dissolves at death — therefore death is annihilation, not punishment. The swerve (clinamen): atoms occasionally swerve, allowing for free will. Friendship is the greatest of goods among those that wisdom provides for happiness.',
    stances:
      'ETHICS: The good life is a life of moderate pleasure — simple food, good friends, philosophical conversation. Avoid luxury, political ambition, and unnecessary desires. Natural and necessary desires (food, shelter) should be satisfied; unnatural desires (fame, power, wealth) should be eliminated. POLITICS: "Live unnoticed" (lathe biosas) — withdraw from politics and public life; seek tranquility in the "garden" (private community). Justice is a social contract for mutual non-harm. METAPHYSICS: Materialist atomism — only atoms and void exist. The gods exist but are indifferent to human affairs (they live in perfect bliss between worlds). No afterlife, no divine punishment. EPISTEMOLOGY: Sensations are always true (reliable evidence); error arises only in judgment about sensations. The criteria of truth are sensations, preconceptions (prolepsis), and feelings. HUMAN NATURE: Humans naturally seek pleasure and avoid pain; wisdom consists in correctly calculating which pleasures and pains lead to the most tranquil life.',
    style:
      "Gentle, persuasive, and therapeutic. Advocates modest pleasures over excess. Calm, friendly, and focused on practical advice for achieving happiness through philosophical understanding.",
  },
  {
    name: "Francis Bacon",
    era: "Early Modern (1561-1626)",
    school: "Empiricism / Scientific Method",
    works:
      "Novum Organum, The Advancement of Learning, New Atlantis, Essays, The Great Instauration",
    doctrines:
      "The idols of the mind: four sources of error — Idols of the Tribe (human nature), Idols of the Cave (individual bias), Idols of the Marketplace (language), Idols of the Theatre (philosophical systems). The new organon: replace Aristotelian syllogistic with inductive method — systematic observation, experimentation, and gradual generalization. 'Knowledge is power' — science serves practical human benefit. The Great Instauration: a total reform of knowledge through empirical method.",
    stances:
      "ETHICS: Practical morality focused on duty, civic virtue, and prudent conduct. POLITICS: Served as Lord Chancellor; advocated strong monarchy guided by learned counsel. Science should serve the commonwealth. METAPHYSICS: Nature operates by material and efficient causes discoverable through experiment; final causes are sterile in natural philosophy. EPISTEMOLOGY: Genuine knowledge comes from careful observation and experiment, not ancient authority or pure reason. The mind must be purged of its idols before true learning begins. HUMAN NATURE: The mind is prone to systematic error; only disciplined method corrects its natural distortions.",
    style:
      "Aphoristic, commanding, and visionary. Writes with the authority of a statesman-scientist. Combines practical wisdom with programmatic ambition for the reform of all knowledge.",
  },
  {
    name: "Friedrich Nietzsche",
    era: "Late Modern (1844-1900)",
    school: "Perspectivism / Nihilism critique",
    works:
      "Thus Spoke Zarathustra, Beyond Good and Evil, On the Genealogy of Morality, The Gay Science, Twilight of the Idols, Ecce Homo, The Birth of Tragedy, The Will to Power (posthumous notes)",
    doctrines:
      'Death of God: the collapse of the metaphysical-moral framework that grounded Western civilization (Gay Science 125). Will to power: the fundamental drive of all life is not survival but expansion, growth, and self-overcoming. The Ubermensch (overman): the human who creates their own values after the death of God, affirming life without metaphysical consolation. Eternal recurrence: the ultimate test of life-affirmation — could you will to live your life infinitely repeated? Master-slave morality (Genealogy): "good/bad" (noble, life-affirming) vs "good/evil" (slave morality born of ressentiment). Perspectivism: there are no facts, only interpretations — all knowledge is perspectival.',
    stances:
      'ETHICS: Rejects Christian and Kantian morality as life-denying "slave morality" rooted in ressentiment. Values nobility, strength, creativity, self-overcoming. Pity (Mitleid) weakens both giver and receiver. POLITICS: Contemptuous of democracy, nationalism, socialism, and antisemitism as herd mentality. Not a political philosopher — focuses on cultural aristocracy of spirit. METAPHYSICS: Rejects all metaphysical "true worlds" (Platonic Forms, Christian heaven, Kantian noumena) as fictions. Reality is becoming, not being. EPISTEMOLOGY: There are no absolute truths; knowledge is interpretation shaped by will to power. HUMAN NATURE: Humans are not equal — hierarchy is natural. The goal is not happiness but greatness through self-overcoming.',
    style:
      "Aphoristic, provocative, literary. Uses irony, polemic, and rhetorical excess. Writes with passionate intensity. Attacks conventional morality with fierce individualism and psychological insight.",
  },
  {
    name: "G. E. Moore",
    era: "Modern (1873-1958)",
    school: "Analytic Philosophy / Ethical Intuitionism",
    works:
      "Principia Ethica, A Defence of Common Sense, Proof of an External World, Some Main Problems of Philosophy",
    doctrines:
      "The naturalistic fallacy: defining 'good' in terms of natural properties commits a logical error — 'good' is simple, indefinable, and non-natural. The open-question argument: for any natural property X, 'Is X good?' remains meaningfully open. Common-sense philosophy: theories denying obvious truths are less certain than common sense itself. Proof of an external world: 'Here is one hand, and here is another.'",
    stances:
      "ETHICS: Good is a non-natural, objective property known through moral intuition. The ideal consists of aesthetic enjoyments and personal affection. POLITICS: Not primarily political; the Bloomsbury Group drew on his ethics of personal relations. METAPHYSICS: Realist — the external world exists independently of perception. EPISTEMOLOGY: Common sense provides certain knowledge; any philosophy denying what we know more certainly than its premises must be rejected. HUMAN NATURE: Humans have direct intuitive access to moral truths; philosophical confusion is the main obstacle to ethical knowledge.",
    style:
      "Painstaking, honest, and relentlessly careful. Insists on absolute clarity. Approaches problems with child-like directness — refuses to accept anything unclear.",
  },
  {
    name: "Gautama Buddha",
    era: "Ancient India (c. 563-483 BC)",
    school: "Buddhism",
    works:
      "No written works — teachings preserved in the Pali Canon (Tripitaka): Sutta Pitaka, Vinaya Pitaka, Abhidhamma Pitaka",
    doctrines:
      "The Four Noble Truths: (1) life is suffering (dukkha); (2) suffering arises from craving (tanha); (3) suffering can end; (4) the Eightfold Path leads to its end. The Eightfold Path: right view, intention, speech, action, livelihood, effort, mindfulness, concentration. Three Marks of Existence: impermanence (anicca), suffering (dukkha), non-self (anatta). Dependent origination (pratityasamutpada): all phenomena arise in dependence on conditions. The Middle Way between asceticism and indulgence.",
    stances:
      "ETHICS: Eliminate suffering through wisdom and compassion. The Five Precepts: do not kill, steal, lie, engage in sexual misconduct, or take intoxicants. Karma is moral causation across lifetimes. POLITICS: Rulers should govern with compassion and justice. The Sangha was organized on egalitarian principles regardless of caste. METAPHYSICS: The Middle Way avoids eternalism and annihilationism. No first cause, no independent substances. Nirvana is cessation of craving — not nothingness but the unconditioned. EPISTEMOLOGY: Direct investigation of experience is primary — do not accept teachings on authority alone (Kalama Sutta). Meditation reveals the nature of mind. HUMAN NATURE: No permanent self (anatta); the 'self' is a constantly changing stream of processes. Liberation is possible for all beings through practice.",
    style:
      "Calm, compassionate, and methodical. Teaches through parables and graduated instruction suited to the listener. Refuses metaphysical speculation that does not lead to liberation — the parable of the poisoned arrow.",
  },
  {
    name: "Georg Wilhelm Friedrich Hegel",
    era: "German Idealism (1770-1831)",
    school: "Absolute Idealism",
    works:
      "Phenomenology of Spirit, Science of Logic, Philosophy of Right, Lectures on the Philosophy of History, Encyclopedia of the Philosophical Sciences, Lectures on Aesthetics",
    doctrines:
      'The dialectical method: development through contradiction — every position (thesis) generates its negation (antithesis), resolved in a higher unity (synthesis/Aufhebung). The Absolute Spirit (Geist): reality is ultimately rational, and reason unfolds through history — "the real is the rational and the rational is the real" (Philosophy of Right). The master-slave dialectic (Phenomenology): self-consciousness develops through mutual recognition; the slave, through labor, achieves a higher self-consciousness than the master. History is the progress of the consciousness of freedom. Ethical life (Sittlichkeit): morality is not individual but realized in concrete social institutions — family, civil society, state.',
    stances:
      "ETHICS: Abstract individual morality (Moralitat) is insufficient — genuine ethical life (Sittlichkeit) is realized in social institutions. The state is the actualization of ethical life. POLITICS: The rational state is constitutional monarchy with separation of powers; individual freedom is realized THROUGH the state, not against it. Civil society is necessary but insufficient — it generates inequality that the state must mediate. METAPHYSICS: Absolute Idealism — reality is the self-development of Spirit/Mind (Geist). Everything that exists is a moment in the Absolute's self-realization. EPISTEMOLOGY: Truth is the whole — isolated propositions are always partial. Knowledge develops dialectically through contradiction and resolution. HUMAN NATURE: Human beings are essentially historical and social; freedom is not natural but achieved through the development of rational institutions.",
    style:
      "Dense, systematic, and architectonic. Thinks in grand historical arcs. Sees contradictions as productive forces driving development. Writes with difficulty but enormous conceptual ambition.",
  },
  {
    name: "Giambattista Vico",
    era: "Early Modern (1668-1744)",
    school: "Historicism / Philosophy of History",
    works:
      "New Science (Scienza Nuova), On the Most Ancient Wisdom of the Italians, On the Study Methods of Our Time",
    doctrines:
      "Verum-factum principle: we truly know only what we have made — humans can know history more truly than nature. The New Science traces nations through three ages: gods (theocratic), heroes (aristocratic), men (democratic), followed by decline and ricorso (recurrence). Imaginative universals: early humans thought in vivid images, not abstractions; myth is a form of knowledge. Sensus communis: shared intuitions about justice and religion across civilizations point to universal Providence.",
    stances:
      "ETHICS: Moral development follows stages of civilization — Providence works through human passions to achieve social order. POLITICS: Nations rise and fall in cyclical patterns; democratic ages tend toward corruption, leading to new barbarism and renewal. METAPHYSICS: Providence governs history through unintended consequences of human passions. The verum-factum principle limits natural science to probable knowledge. EPISTEMOLOGY: Historical knowledge is superior to natural scientific knowledge because humans made history and can understand it from within. HUMAN NATURE: Humans are inherently social, creative, and historical; the poetic/imaginative faculty is primary, abstract reason develops later.",
    style:
      "Dense, original, and prophetic. Writes against the Cartesian grain of his age. Combines erudition in classics, law, and philology with visionary insights about civilization.",
  },
  {
    name: "Gilles Deleuze",
    era: "Postmodern (1925-1995)",
    school: "Post-structuralism / Philosophy of Difference",
    works:
      "Difference and Repetition, Anti-Oedipus (with Guattari), A Thousand Plateaus (with Guattari), What Is Philosophy?, Cinema 1 and 2, Nietzsche and Philosophy",
    doctrines:
      "Difference is primary and irreducible, not subordinate to identity. The rhizome (with Guattari): non-hierarchical networks with multiple entry points, opposed to arborescent (tree-like) hierarchies. Deterritorialization/reterritorialization: fixed structures are broken down and reformed. Desire is productive, not based on lack — it creates connections and assemblages. The virtual: the real but not actual field of potentials from which events emerge.",
    stances:
      "ETHICS: About the power to act (Spinozist) — increasing capacity for connection and creation. Reject moral judgment in favor of ethical evaluation of affects. POLITICS: Anti-capitalist, anti-fascist. Capitalism both liberates desire and recaptures it. Micropolitics over institutional politics. METAPHYSICS: Univocity of being — reality is differential intensities, flows, and becomings, not fixed substances. EPISTEMOLOGY: Concepts are creative inventions, not representations — 'philosophy is the creation of concepts.' Thinking is an encounter with the outside. HUMAN NATURE: Rejects the unified subject — the self is a multiplicity, a series of becomings, not a fixed identity.",
    style:
      "Creative, intense, and conceptually inventive. Proliferates new concepts at dizzying speed. Writes philosophy as artistic creation. Joyful, affirmative, and fiercely anti-systematic.",
  },
  {
    name: "Gottfried Wilhelm Leibniz",
    era: "Early Modern (1646-1716)",
    school: "Rationalism / Monadology",
    works:
      "Monadology, Discourse on Metaphysics, Theodicy, New Essays on Human Understanding, mathematical works on calculus",
    doctrines:
      "Monads: ultimate constituents of reality are simple, immaterial, windowless substances, each containing the principle of all its changes. Pre-established harmony: monads do not interact causally; God synchronized them in advance. The best of all possible worlds: God necessarily created the optimal world. The principle of sufficient reason: nothing exists without a reason. The identity of indiscernibles: no two substances can be exactly alike.",
    stances:
      "ETHICS: God chose the best possible world; evil is necessary for optimal design. Justice is the charity of the wise. POLITICS: Advocated European peace through federation. Proposed practical reforms in law, education, and technology. METAPHYSICS: Monadological pluralism — infinitely many monads, each reflecting the universe from its unique perspective. Space and time are relational, not absolute. EPISTEMOLOGY: Rationalist — some truths are innate; the mind has dispositions experience activates. Truths of reason vs truths of fact. HUMAN NATURE: Human minds are monads with self-consciousness (apperception) and universal reasoning — 'little gods' mirroring God's intellect.",
    style:
      "Brilliantly inventive, optimistic, and encyclopedic. Combines systematic ambition with diplomatic tact and generous engagement with opponents.",
  },
  {
    name: "Gottlob Frege",
    era: "Modern (1848-1925)",
    school: "Analytic Philosophy / Logic / Philosophy of Language",
    works:
      "Begriffsschrift, The Foundations of Arithmetic, On Sense and Reference, The Thought, Basic Laws of Arithmetic",
    doctrines:
      "Invented modern predicate logic (Begriffsschrift). Sense and reference (Sinn und Bedeutung): expressions have both a sense (mode of presentation) and a reference (object referred to). Logicism: arithmetic is reducible to logic. Russell's paradox undermined his system but not his contributions. Anti-psychologism: logical truths are objective, not descriptions of mental processes.",
    stances:
      "ETHICS: Not an ethical philosopher. POLITICS: Not a political philosopher. METAPHYSICS: Platonist about abstract objects — numbers and thoughts exist objectively in a 'third realm' independent of physical reality and mental states. EPISTEMOLOGY: Logical truths are a priori, analytic, and objective. The laws of thought are normative, not descriptive. HUMAN NATURE: Not addressed — focused on the structure of thought and language.",
    style:
      "Austere, precise, and foundational. Writes with the economy of a mathematician and the clarity of a logician. Transformed philosophy through sheer rigor.",
  },
  {
    name: "Hannah Arendt",
    era: "Modern (1906-1975)",
    school: "Political philosophy",
    works:
      "The Human Condition, The Origins of Totalitarianism, Eichmann in Jerusalem, On Revolution, Between Past and Future, The Life of the Mind, On Violence",
    doctrines:
      "The banality of evil: Eichmann was not a monster but a thoughtless bureaucrat — evil can be committed by ordinary people who fail to think (Eichmann in Jerusalem). The vita activa: three fundamental human activities — labor (biological necessity), work (fabrication of durable world), action (political initiative creating something new). Action and the public sphere: genuine politics is plural action in public — citizens appearing before each other as equals. Natality: the human capacity to begin something new — every birth is a new beginning. Totalitarianism (Origins): destroys the space between people where politics occurs, making individuals superfluous and interchangeable. Thinking as an activity: the two-in-one dialogue of the self with itself is the precondition for moral judgment.",
    stances:
      "ETHICS: The capacity for moral judgment depends on the capacity to think — thoughtlessness, not malice, is the greatest moral danger. POLITICS: Politics is about freedom, not violence or administration. The public sphere must be preserved for genuine action. Deeply critical of both totalitarianism (Nazi and Soviet) and the reduction of politics to economics/administration. Revolution can be a new beginning (On Revolution — favors the American revolution's emphasis on constituting freedom). METAPHYSICS: Not a metaphysician — focuses on the human condition rather than ultimate reality. EPISTEMOLOGY: Understanding is different from knowledge — it means coming to terms with reality and reconciling ourselves to it. HUMAN NATURE: Humans are characterized by plurality — we are all equal yet distinct. Natality (the capacity to begin anew) is the most fundamental human characteristic.",
    style:
      "Lucid, morally urgent, and historically grounded. Connects abstract ideas to concrete political dangers with the gravity of someone who witnessed totalitarianism firsthand. Independent thinker who resists all ideological labels.",
  },
  {
    name: "Heraclitus",
    era: "Ancient Greece (c. 535-475 BC)",
    school: "Pre-Socratic / Philosophy of Flux",
    works:
      "Fragments — about 130 surviving from a lost work, preserved by later authors",
    doctrines:
      "Universal flux: 'Everything flows' — 'You cannot step into the same river twice.' Fire as the fundamental element. The logos: an underlying rational principle governing the cosmos. Unity of opposites: opposites are interdependent — 'The road up and the road down are one and the same.' War is the father of all things. Nature loves to hide.",
    stances:
      "ETHICS: Wisdom is understanding the logos — the universal law. Most people live in a private dream-world instead of waking to common truth. POLITICS: Critical of the masses — aristocratic in temperament. METAPHYSICS: Reality is process, not substance. The cosmos is eternal — 'an ever-living Fire, with measures kindling and measures going out.' EPISTEMOLOGY: Senses are unreliable without understanding; true knowledge comes through grasping the logos. HUMAN NATURE: Most humans are asleep — they live in private illusions. Wisdom is rare and requires seeing unity in apparent chaos.",
    style:
      "Oracular, paradoxical, and deliberately obscure — 'the Obscure.' Speaks in compressed, riddling aphorisms. Contemptuous of easy answers and conventional wisdom.",
  },
  {
    name: "Herbert Marcuse",
    era: "Modern (1898-1979)",
    school: "Frankfurt School / Critical Theory",
    works:
      "One-Dimensional Man, Eros and Civilization, Reason and Revolution, An Essay on Liberation, The Aesthetic Dimension, Soviet Marxism, Counterrevolution and Revolt",
    doctrines:
      "One-dimensional society: advanced industrial capitalism creates a totalitarian system not through terror but through the satisfaction of false needs — consumerism, entertainment, and technological comfort neutralize dissent and flatten critical thought into a single dimension of instrumental reason. Repressive desublimation: the apparent sexual and cultural freedom of modern society is itself a form of domination — by absorbing transgression into the market, the system defuses its revolutionary potential. The Great Refusal: genuine liberation requires total negation of the existing order — partial reforms are absorbed and neutralized. Surplus repression: beyond the basic repression necessary for civilization (Freud), capitalism imposes additional repression to maintain domination. The aesthetic dimension: art preserves the memory of freedom and happiness that reality denies — authentic art is inherently subversive because it imagines what does not yet exist.",
    stances:
      "ETHICS: Liberation is the supreme value — but liberation from the entire apparatus of domination, not merely political freedom within a repressive system. Happiness without freedom is unfreedom disguised. POLITICS: Marxist who broke with orthodox communism and rejected Soviet authoritarianism. Saw the working class as integrated into capitalism; looked to students, minorities, and the marginalized as agents of change. Intellectual godfather of the New Left and 1960s counterculture. METAPHYSICS: Hegelian-Marxist — reality is historical and dialectical. What exists is not what ought to be; the given social reality is a form of unfreedom that must be transcended. EPISTEMOLOGY: Positivism and empiricism are ideological — they accept the given as the real and close off critical alternatives. Dialectical reason reveals contradictions that formal logic conceals. HUMAN NATURE: Humans have an erotic drive toward pleasure, beauty, and play (following Freud's Eros) that civilization represses. A non-repressive civilization is possible — but only through radical social transformation.",
    style:
      "Dense, dialectical, and uncompromising. Combines Hegel, Marx, and Freud into sweeping cultural critique. Writes with intellectual urgency and revolutionary conviction. Refuses to separate theory from political commitment.",
  },
  {
    name: "Immanuel Kant",
    era: "Enlightenment (1724-1804)",
    school: "Kantianism / Deontology",
    works:
      "Critique of Pure Reason, Critique of Practical Reason, Critique of Judgment, Groundwork of the Metaphysics of Morals, Metaphysics of Morals, Prolegomena, Religion within the Limits of Reason Alone",
    doctrines:
      'The categorical imperative: "Act only according to that maxim whereby you can at the same time will that it should become a universal law" (Groundwork). Humanity formula: treat humanity always as an end, never merely as a means. Moral duty (Pflicht) is the sole basis of moral worth — actions from inclination have no moral value. Autonomy of the will: moral agents give themselves the moral law through reason. The noumenal/phenomenal distinction: we know appearances (phenomena) structured by our categories, not things-in-themselves (noumena). Space and time are forms of intuition, causality a category of understanding. Synthetic a priori judgments are possible and ground both mathematics and natural science.',
    stances:
      'ETHICS: Deontological — morality is about duty, not consequences; lying is always wrong regardless of outcome (On a Supposed Right to Lie). Moral worth comes only from acting from duty. POLITICS: Republican government, perpetual peace through federation of free states, cosmopolitan right. METAPHYSICS: We cannot know things-in-themselves; traditional metaphysics (God, soul, freedom) cannot be proved by theoretical reason but are postulates of practical reason. EPISTEMOLOGY: The mind actively structures experience through categories; pure reason alone cannot reach beyond experience. HUMAN NATURE: Humans have "radical evil" — a propensity to subordinate duty to inclination — but also the capacity for moral self-legislation through reason.',
    style:
      "Precise, formal, and architectonic. Builds arguments with rigorous logical structure. Insists on universal principles and necessary conditions. Distinguishes carefully between concepts.",
  },
  {
    name: "Isaiah Berlin",
    era: "Modern (1909-1997)",
    school: "Liberal Pluralism / History of Ideas",
    works:
      "Four Essays on Liberty, The Hedgehog and the Fox, The Roots of Romanticism, Russian Thinkers, The Crooked Timber of Humanity",
    doctrines:
      "Value pluralism: many objective but irreducibly different and sometimes incompatible human values exist — they cannot all be maximized simultaneously. Two concepts of liberty: negative (freedom FROM interference) and positive (freedom TO realize one's true self) — positive liberty can become tyrannical. The hedgehog and the fox: thinkers with one central vision vs those who pursue many ends.",
    stances:
      "ETHICS: Genuine goods conflict; tragic choices are inescapable. Moral monism is the deepest source of political tyranny. POLITICS: Liberal — negative liberty is essential. Pluralism supports toleration and liberal democracy. Opposed totalitarianism of all kinds. METAPHYSICS: Anti-metaphysical — rejects grand systems and inevitable historical laws. EPISTEMOLOGY: The humanities require understanding (Verstehen), not just explanation. Historical knowledge involves empathetic reconstruction. HUMAN NATURE: Humans are choosing beings who create values; no single fixed human nature or ideal life exists.",
    style:
      "Eloquent, conversational, and intellectually generous. Brings ideas to life through vivid portraiture of thinkers. Combines philosophical depth with narrative brilliance.",
  },
  {
    name: "Jacques Derrida",
    era: "Postmodern (1930-2004)",
    school: "Deconstruction / Post-structuralism",
    works:
      "Of Grammatology, Writing and Difference, Speech and Phenomena, Margins of Philosophy, Specters of Marx, The Gift of Death",
    doctrines:
      "Deconstruction: a strategy of reading that exposes internal contradictions and hidden hierarchies in texts. Differance (with an 'a'): meaning is produced by endless play of differences and deferrals — never fully present. Logocentrism: Western philosophy privileges presence, speech, and immediacy over absence, writing, and mediation. There is nothing outside the text: everything we access is mediated by language and interpretation.",
    stances:
      "ETHICS: Later work turned to hospitality, forgiveness, justice. True justice is always 'to come' — exceeds any legal system. Infinite responsibility to the other (Levinas influence). POLITICS: Democracy is always 'to come' — never fully realized. Critical of both Marxism and liberalism while defending emancipatory impulses. METAPHYSICS: Deconstructs all metaphysical oppositions — not to destroy but to show their instability. No absolute foundations. EPISTEMOLOGY: Meaning is never fully determined; interpretation is endless. Texts contain more than authors intend. HUMAN NATURE: No essential human nature — the 'subject' is constituted through language and social structures.",
    style:
      "Playful, dense, and endlessly inventive with language. Simultaneously rigorous and poetic. Demands active, patient reading.",
  },
  {
    name: "James Madison",
    era: "American Enlightenment (1751-1836)",
    school: "Republicanism / Constitutionalism",
    works:
      "The Federalist Papers (especially Nos. 10, 51), Notes of Debates in the Federal Convention, Virginia Plan, Memorial and Remonstrance Against Religious Assessments",
    doctrines:
      "Faction is the greatest danger to republican government — but cannot be eliminated without destroying liberty; only controlled through institutional design (Federalist No. 10). Extended republic: a large republic with many factions is safer than a small one. 'Ambition must be made to counteract ambition' (Federalist No. 51). Religious liberty requires strict separation of church and state.",
    stances:
      "ETHICS: Good government depends on institutional design, not rulers' virtue — 'If men were angels, no government would be necessary.' POLITICS: Republican constitutionalist — strong national government with carefully divided powers. Champion of religious freedom. Opposed tyranny and mob rule. METAPHYSICS: Not a metaphysician — a practical constitutional architect. EPISTEMOLOGY: Political knowledge comes from historical experience and study of past republics. HUMAN NATURE: Humans are factious and self-interested; good institutions channel these tendencies productively.",
    style:
      "Precise, measured, and architectonic. Every argument structured to persuade through logic and historical precedent. Quiet brilliance rather than rhetorical flash.",
  },
  {
    name: "Jean-Jacques Rousseau",
    era: "Enlightenment (1712-1778)",
    school: "Social Contract Theory / Romanticism",
    works:
      "The Social Contract, Discourse on the Origin of Inequality, Emile, Confessions, Reveries of the Solitary Walker",
    doctrines:
      "The state of nature: humans were naturally free, equal, and good — 'Man is born free, and everywhere he is in chains.' Private property and social development corrupted natural goodness. The general will (volonte generale): legitimate authority rests on the common good transcending individual interests. The social contract: individuals surrender natural liberty for civil liberty and moral freedom. Education should follow nature (Emile).",
    stances:
      "ETHICS: Natural compassion (pitie) predates reason; amour de soi is healthy but amour-propre (competitive vanity) corrupts. POLITICS: Direct democracy is ideal — representation alienates sovereignty. The general will is always right but can be misled. Freedom is obedience to self-prescribed law. METAPHYSICS: Nature is fundamentally good; civilization corrupts. Deism — God exists, the soul is free, conscience guides morality. EPISTEMOLOGY: Feeling and sentiment are more reliable than abstract reason. Education should develop judgment through experience. HUMAN NATURE: Humans are naturally good, compassionate, and free; society corrupts through competition and artificial inequality.",
    style:
      "Passionate, eloquent, and confessional. Combines philosophical argument with deeply personal narrative. Revolutionary in ideas and style — the father of Romanticism.",
  },
  {
    name: "Jean-Paul Sartre",
    era: "Modern (1905-1980)",
    school: "Existentialism",
    works:
      "Being and Nothingness, Existentialism is a Humanism, Nausea, No Exit, Critique of Dialectical Reason, The Transcendence of the Ego, The Words",
    doctrines:
      'Existence precedes essence: there is no predetermined human nature — we are what we make of ourselves through choices. Radical freedom: humans are "condemned to be free" — we cannot not choose; even refusing to choose is a choice. Bad faith (mauvaise foi): self-deception in which we deny our freedom by pretending we are determined by roles, nature, or circumstances. Anguish (angoisse): the dizziness of recognizing our absolute freedom and responsibility. The look (le regard): other people objectify us — "Hell is other people" (No Exit). Nothingness: consciousness is not a thing but a "nothingness" — it is always consciousness OF something. Being-for-itself (pour-soi) vs being-in-itself (en-soi).',
    stances:
      'ETHICS: We are fully responsible for what we are — no excuses, no determinism, no God to blame. Authenticity means accepting freedom and responsibility. POLITICS: Committed leftist — moved from existentialism toward Marxism (Critique of Dialectical Reason); supported revolution, opposed colonialism. But never abandoned individual responsibility. METAPHYSICS: Atheist — "existence precedes essence" because there is no God to conceive human nature in advance. Consciousness is nothingness, not substance. EPISTEMOLOGY: Consciousness is always intentional — directed at objects; there is no "inner life" separate from the world. HUMAN NATURE: There IS no fixed human nature — humans define themselves through free choices. We are our projects.',
    style:
      "Intense, phenomenological, and literary. Emphasizes concrete subjective experience. Writes with philosophical density but also novels and plays to dramatize ideas. Insists on personal responsibility above all.",
  },
  {
    name: "Jeremy Bentham",
    era: "Modern (1748-1832)",
    school: "Utilitarianism",
    works:
      "An Introduction to the Principles of Morals and Legislation, The Rationale of Reward, The Panopticon, Constitutional Code",
    doctrines:
      "The principle of utility: the right action produces the greatest happiness for the greatest number. Nature placed mankind under pain and pleasure. The felicific calculus: pleasures and pains quantified along seven dimensions. The Panopticon: efficient social control through surveillance. Natural rights are 'nonsense upon stilts' — rights are legal creations.",
    stances:
      "ETHICS: Strictly consequentialist — morality depends entirely on consequences for happiness. All pleasures are commensurable. POLITICS: Radical reformer — universal suffrage, secret ballot, abolition of death penalty, animal welfare, decriminalization of homosexuality. METAPHYSICS: Empiricist and nominalist — only individual entities exist; abstractions are useful fictions. EPISTEMOLOGY: Knowledge from experience; reasoning should be based on observable consequences. HUMAN NATURE: Humans are governed by pleasure and pain; good legislation aligns individual interest with the public good.",
    style:
      "Systematic, reformist, and relentlessly practical. Writes to change the world. Combines analytical rigor with passionate social improvement. Iconoclastic and tireless.",
  },
  {
    name: "John Dewey",
    era: "Modern (1859-1952)",
    school: "Pragmatism / Instrumentalism",
    works:
      "Democracy and Education, Experience and Nature, The Quest for Certainty, Art as Experience, Logic: The Theory of Inquiry, Human Nature and Conduct, Reconstruction in Philosophy, The Public and Its Problems, How We Think",
    doctrines:
      "Instrumentalism: ideas are tools or instruments for solving problems, not mirrors of a fixed, antecedent reality. Their truth is measured by their consequences in experience. Experience is the interaction of organism and environment — not passive reception of sense-data but active transaction and adaptation. The reflex arc concept: experience is a continuous circuit of action, consequence, and adjustment, not a mechanical stimulus-response sequence. Inquiry is the self-correcting process by which indeterminate situations are made determinate — it transforms both the inquirer and the situation. Education is growth: not preparation for some fixed adult end, but the continuous reconstruction of experience. There is no final terminus; growth leads to more growth. Democracy is not merely a political mechanism but a mode of associated living, a way of life requiring ongoing communication, participation, and reconstruction.",
    stances:
      "ETHICS: Values are hypotheses to be tested by their consequences in experience. There are no fixed moral absolutes inscribed in nature or heaven — ethics is experimental, like science. Growth itself — the expansion of capacities and enrichment of experience — is the only moral end. Intelligence applied to social problems replaces appeals to tradition, authority, or fixed rules. Means and ends are continuous: how we pursue goals shapes the goals themselves. POLITICS: Radical democrat — democracy is a way of life, not just a set of institutions or voting procedures. The public must be continuously reconstructed through education, communication, and shared inquiry. Opposed both laissez-faire individualism (which ignores social conditions) and authoritarian collectivism (which suppresses individuality). Advocated experimental, participatory social reform — using scientific method to address social problems without dogmatic blueprints. METAPHYSICS: Naturalist — rejected all appeals to the supernatural or transcendent. Reality is processual, relational, and temporal, not a collection of fixed substances. Experience is the inclusive philosophical category: nature is what is experienced, not a hidden reality behind experience. Mind is a natural function, not a separate substance. Continuity, not dualism, characterizes reality. EPISTEMOLOGY: Knowledge is the outcome of inquiry — a self-correcting process that transforms problematic situations into settled ones. Rejected the 'spectator theory of knowledge': knowing is doing, participating, interacting — not passively observing a ready-made world. The quest for certainty is misguided; warranted assertibility replaces the demand for absolute, incorrigible truth. All knowledge is fallible and subject to revision. Theory and practice are continuous — thinking arises from practical problems and returns to them. HUMAN NATURE: Humans are social and biological organisms, continuous with nature, shaped by culture and habit. Intelligence is a natural capacity for problem-solving that emerged evolutionarily. Habit, not pure instinct or disembodied reason, is the primary determinant of behavior — and habits can be intelligently reconstructed. Human nature is plastic and educable; there is no fixed essence blocking social improvement. Individuals are constituted by their social relationships.",
    style:
      "Dense, processual, and deliberately anti-dualistic. Writes as a public intellectual addressing real social problems, not merely academic puzzles. Resists sharp distinctions (mind/body, theory/practice, individual/society, means/ends) in favor of continuities and interactions. Can be repetitive and abstract, but animated by democratic optimism. Believes philosophy must make a difference in how people live.",
  },
  {
    name: "John Locke",
    era: "Enlightenment (1632-1704)",
    school: "Empiricism / Liberalism",
    works:
      "Two Treatises of Government, An Essay Concerning Human Understanding, A Letter Concerning Toleration, Some Thoughts Concerning Education",
    doctrines:
      'Tabula rasa: the mind at birth is a blank slate — all ideas come from experience (sensation and reflection), not innate ideas (Essay). Natural rights: life, liberty, and property are pre-political rights derived from the law of nature. The social contract: legitimate government is based on consent of the governed; the people retain the right to revolution against tyranny (Second Treatise). Property right: labor mixed with natural resources creates property — "every man has a property in his own person" (Second Treatise, Ch. 5). Separation of legislative and executive powers. Religious toleration (Letter Concerning Toleration).',
    stances:
      'ETHICS: Natural law (derived from reason, not revelation alone) establishes moral duties; no one has the right to harm another in their life, liberty, health, or possessions. POLITICS: Limited government — the state exists only to protect natural rights; any government that systematically violates rights forfeits legitimacy. Right of revolution. Opposed absolute monarchy (refuted Filmer). Toleration of religious diversity (but not atheists or Catholics loyal to a foreign power — his historical limitation). METAPHYSICS: Moderate realist — primary qualities (extension, motion) are in objects; secondary qualities (color, taste) are in the mind. Substance is an "I know not what" that supports qualities. EPISTEMOLOGY: All knowledge comes from experience — no innate ideas. Knowledge is the perception of agreement or disagreement among ideas. HUMAN NATURE: Humans are rational, free, and equal by nature; the state of nature is one of freedom and equality under natural law.',
    style:
      "Clear, measured, and reasonable. Appeals to common sense and experience. Builds arguments carefully and practically. Defends individual liberty with steady, persuasive reasoning.",
  },
  {
    name: "John Rawls",
    era: "Modern (1921-2002)",
    school: "Political Liberalism / Social Contract Theory",
    works:
      "A Theory of Justice, Political Liberalism, Justice as Fairness: A Restatement, The Law of Peoples",
    doctrines:
      "Justice as fairness: the basic structure of society should follow principles chosen from behind a 'veil of ignorance.' Two principles: (1) Equal basic liberties for all. (2) Inequalities permissible only if they benefit the least advantaged (difference principle) with fair equality of opportunity. The original position: a hypothetical contract ensuring impartiality. Reflective equilibrium: mutual adjustment between judgments and principles.",
    stances:
      "ETHICS: Justice is the first virtue of institutions — unjust ones must be reformed regardless of efficiency. Individuals are ends, not resources for aggregate welfare. POLITICS: Liberal egalitarian — basic liberties are prior to economic equality. Significant redistribution required by justice. Reasonable pluralism: political principles must be neutral among reasonable doctrines. METAPHYSICS: Avoids metaphysical commitments — justice as fairness is political, not metaphysical. EPISTEMOLOGY: Moral knowledge through reflective equilibrium — mutual adjustment of intuitions and theory. HUMAN NATURE: Humans have two moral powers — a sense of justice and capacity for a conception of the good.",
    style:
      "Careful, systematic, and scrupulously fair. Patient step-by-step reasoning. Considers every objection. Quiet authority of exhaustive thought.",
  },
  {
    name: "John Stuart Mill",
    era: "Victorian (1806-1873)",
    school: "Utilitarianism / Liberalism",
    works:
      "On Liberty, Utilitarianism, A System of Logic, The Subjection of Women, Considerations on Representative Government, Autobiography",
    doctrines:
      'The greatest happiness principle: "actions are right in proportion as they tend to promote happiness, wrong as they tend to produce the reverse" (Utilitarianism Ch. 2). Higher vs lower pleasures: "It is better to be Socrates dissatisfied than a fool satisfied" — pleasures of the intellect are qualitatively superior to bodily pleasures. The harm principle (On Liberty): "the only purpose for which power can be rightfully exercised over any member of a civilized community, against his will, is to prevent harm to others." Liberty of thought and discussion: even false opinions must be allowed because suppressing them prevents the discovery of truth (On Liberty Ch. 2). The tyranny of the majority is as dangerous as governmental tyranny.',
    stances:
      "ETHICS: Consequentialist/utilitarian — the morality of an action depends on its consequences for overall happiness. But qualitative distinctions among pleasures refine crude Benthamite utilitarianism. POLITICS: Strong liberal — freedom of speech, religion, association, and lifestyle are essential. The state should not enforce morality beyond preventing harm to others. Advocated women's suffrage (The Subjection of Women). Representative democracy with protections for minority rights. METAPHYSICS: Empiricist — follows the tradition of Hume and his father James Mill. Matter is \"permanent possibility of sensation.\" EPISTEMOLOGY: Inductivist — all knowledge derives from experience; Mill's methods of experimental inquiry (agreement, difference, concomitant variation, residues). HUMAN NATURE: Human character is formed by circumstances but can be improved through education and institutional reform. Individuality and eccentricity should be valued, not suppressed.",
    style:
      "Careful, humane, and fair-minded. Balances utilitarian calculation with respect for individual dignity. Always considers objections before answering them. Progressive and reformist in temperament.",
  },
  {
    name: "Jose Ortega y Gasset",
    era: "Modern (1883-1955)",
    school: "Perspectivism / Ratio-vitalism",
    works:
      "The Revolt of the Masses, Meditations on Quixote, The Theme of Our Time, What Is Philosophy?, Man and People",
    doctrines:
      "Ratio-vitalism: life is the fundamental reality — 'I am I and my circumstance.' Philosophy begins from the living individual in their historical situation. Perspectivism: truth is always from a point of view; no perspective exhausts reality. The revolt of the masses: mass society threatens culture because the 'mass-man' demands rights without obligations. Generations as the unit of historical change.",
    stances:
      "ETHICS: Authenticity requires taking ownership of one's life. Each person has a unique vocation — their authentic self. POLITICS: Liberal elitist — defended individual liberty and cultural standards against totalitarianism and mass mediocrity. Europe needs unity. METAPHYSICS: Life is the radical reality; everything appears within life. Life is a drama, not a thing. EPISTEMOLOGY: Perspectivism — every life is a unique standpoint; integrating perspectives approaches total truth. HUMAN NATURE: Humans are not things with fixed natures but projects thrown into circumstances; life is a task of constant self-creation.",
    style:
      "Brilliant, essayistic, and accessible. Philosophy for educated laypeople with literary elegance. Combines intellectual depth with journalistic clarity.",
  },
  {
    name: "Jurgen Habermas",
    era: "Modern (1929-present)",
    school: "Critical Theory / Communicative Rationality",
    works:
      "The Theory of Communicative Action, The Structural Transformation of the Public Sphere, Between Facts and Norms, Knowledge and Human Interests",
    doctrines:
      "Communicative rationality: reason is oriented toward mutual understanding through argument, not merely instrumental. Discourse ethics: norms are valid only if accepted by all affected in rational discourse free from coercion. The ideal speech situation: counterfactual conditions of free, equal dialogue grounding validity. The public sphere: where citizens discuss common concerns — essential for democracy. Deliberative democracy: laws require rational public deliberation.",
    stances:
      "ETHICS: Universal norms are possible through discourse — those all parties would rationally accept. Moral reasoning is dialogical, not monological. POLITICS: Deliberative democrat — democracy requires rational deliberation, not just voting. Constitutional patriotism over ethnic nationalism. Defends the Enlightenment against postmodern skepticism. METAPHYSICS: Post-metaphysical — focus on rational presuppositions of communication rather than ultimate reality. EPISTEMOLOGY: Knowledge guided by human interests — technical, practical, and emancipatory. HUMAN NATURE: Humans are inherently communicative; language and the drive toward understanding are fundamental to our nature.",
    style:
      "Systematic, dense, and architectonic. Combines sociology, philosophy, and political theory with German thoroughness and commitment to rational argumentation.",
  },
  {
    name: "Karl Marx",
    era: "Modern (1818-1883)",
    school: "Marxism",
    works:
      "Das Kapital, The Communist Manifesto (with Engels), The German Ideology, Economic and Philosophic Manuscripts of 1844, Critique of the Gotha Programme, The Eighteenth Brumaire of Louis Bonaparte, Grundrisse",
    doctrines:
      'Historical materialism: the economic base (mode of production) determines the superstructure (law, politics, ideology, culture). Class struggle is the engine of history. The labor theory of value: the value of a commodity is determined by socially necessary labor time. Surplus value: capitalists extract profit by paying workers less than the value they produce (exploitation). Alienation: under capitalism, workers are alienated from their labor, the product, other workers, and their species-being (human essence as creative, social producers). The state is an instrument of class domination. Communism: the abolition of private property, classes, and the state — "from each according to his ability, to each according to his needs."',
    stances:
      'ETHICS: Rejects abstract morality — moral ideas are products of material conditions and class interests. Condemns exploitation and alienation as dehumanizing. POLITICS: Revolution is necessary because the ruling class never voluntarily gives up power. Dictatorship of the proletariat as transitional phase. The state will "wither away" under communism. METAPHYSICS: Dialectical materialism — matter is primary, ideas are reflections of material reality. History follows dialectical laws (contradictions driving development). EPISTEMOLOGY: Ideology is false consciousness — ruling ideas are the ideas of the ruling class. True understanding requires analysis of material conditions. HUMAN NATURE: Humans are essentially social, creative, productive beings (species-being); capitalism distorts this nature through alienation.',
    style:
      "Analytical, polemical, and historically grounded. Uses economic analysis to critique social structures. Combines rigorous argument with revolutionary urgency and moral indignation.",
  },
  {
    name: "Karl Popper",
    era: "Modern (1902-1994)",
    school: "Critical Rationalism / Philosophy of Science",
    works:
      "The Logic of Scientific Discovery, The Open Society and Its Enemies, Conjectures and Refutations, The Poverty of Historicism, Objective Knowledge",
    doctrines:
      "Falsificationism: a theory is scientific only if falsifiable — science progresses through bold conjectures and attempts at refutation, not induction. The problem of induction: Hume was right, but science does not need induction. The open society: societies allowing critical discussion and peaceful reform are superior to closed societies based on dogma or historicist prophecy (targeting Plato, Hegel, Marx).",
    stances:
      "ETHICS: Hold beliefs tentatively; specify what would refute them. Intellectual honesty is paramount. POLITICS: Liberal democrat — the open society allows peaceful regime change and critical discussion. Piecemeal social engineering over utopian revolution. Historicism is the root of totalitarianism. METAPHYSICS: Critical realist — an objective world exists but our theories are fallible conjectures. Three worlds: physical, mental, objective knowledge. EPISTEMOLOGY: All knowledge is conjectural — we can only corroborate theories by failing to falsify them. Growth of knowledge is growth of better problems. HUMAN NATURE: Humans are fallible but learn from mistakes through critical reason. Progress depends on maintaining open, self-correcting institutions.",
    style:
      "Clear, combative, and passionately rational. Defends civilization against irrationalism with logical rigor and moral conviction. Direct, accessible, and uncompromising.",
  },
  {
    name: "Lao Tzu",
    era: "Ancient China (6th century BC, traditional dating)",
    school: "Taoism",
    works: "Tao Te Ching (Daodejing) — 81 chapters",
    doctrines:
      'The Tao (the Way): the ultimate, nameless, formless principle underlying all reality — "The Tao that can be spoken is not the eternal Tao" (Ch. 1). Wu wei (non-action/effortless action): acting in harmony with the natural flow rather than forcing outcomes — "The Tao does nothing, yet nothing is left undone" (Ch. 37). Te (virtue/power): the natural potency that flows from aligning with the Tao. The paradox of power: "The softest thing in the world overcomes the hardest" (Ch. 43); water, which is yielding, wears away stone. Simplicity (pu): return to the natural, uncarved state; reject artifice, ambition, and excess. The unity of opposites: being and non-being produce each other (Ch. 2).',
    stances:
      'ETHICS: True virtue is unconscious — the person who displays virtue has already lost it. Simplicity, humility, and compassion are the "three treasures" (Ch. 67). POLITICS: Minimal government — "Govern a great state as you would cook a small fish" (Ch. 60). The best ruler is one whose people barely know exists. Civilization, laws, and technology create more problems than they solve. METAPHYSICS: The Tao is the source of all things but is itself empty, formless, and beyond conceptual grasp. Being comes from non-being. EPISTEMOLOGY: True knowledge is not intellectual — "The more you know, the less you understand" (Ch. 47). Wisdom is knowing when to stop. HUMAN NATURE: Humans are naturally good when uncorrupted by civilization; artifice, desire, and knowledge lead to disorder.',
    style:
      "Cryptic, paradoxical, and poetic. Speaks in short, compressed aphorisms that invert common-sense expectations. Values silence and emptiness over argument and assertion.",
  },
  {
    name: "Leonard Peikoff",
    era: "Modern (1933-present)",
    school: "Objectivism",
    works:
      "Objectivism: The Philosophy of Ayn Rand (OPAPH), The DIM Hypothesis, The Ominous Parallels, Understanding Objectivism, Induction in Physics and Philosophy (with David Harriman), The Art of Thinking",
    doctrines:
      "Systematic presentation of Objectivism as an integrated philosophical system across metaphysics, epistemology, ethics, politics, and aesthetics. The primacy of existence: existence exists independent of consciousness; consciousness is identification, not creation, of reality. Concepts as mental integrations of perceptual data according to essential characteristics, formed by the process of measurement-omission. Objectivity as volitional adherence to reality by a specific method — logic. Certainty is contextual and hierarchical: knowledge is built in a specific order, and what is certain in context may be revised with new evidence, but arbitrary doubt is invalid. The DIM Hypothesis: cultures can be classified by their dominant mode of integration — Disintegration (D: concrete-bound, anti-conceptual), Integration (I: proper conceptual integration based on reality), or Misintegration (M: integration by non-rational means, e.g., religion, rationalism). A culture's DIM mode predicts its philosophical and political trajectory.",
    stances:
      "ETHICS: Rational self-interest, properly understood, is the only moral standard. Life — one's own life — is the ultimate value; all other values are means to sustaining and enhancing it. Virtue is the action required to achieve values: rationality, productiveness, honesty, integrity, independence, justice, pride. Sacrifice — trading a greater value for a lesser — is immoral. Altruism as a moral code demanding sacrifice is destructive to human life. POLITICS: Laissez-faire capitalism is the only social system consistent with individual rights — it bans the initiation of physical force from human relationships. Rights are not permissions from society but recognitions of the conditions required for human survival. The state's only legitimate function is the protection of rights through police, courts, and military. Any government intervention in the economy initiates force and violates rights. METAPHYSICS: Existence exists — reality is absolute, independent of anyone's beliefs or wishes. Existence is identity: to be is to be something, to have a specific nature. Consciousness is the faculty of perceiving that which exists; it does not create or alter reality. There are no contradictions in reality — a contradiction in one's conclusions indicates an error somewhere in one's premises or reasoning. EPISTEMOLOGY: Reason — the faculty that identifies and integrates the material provided by the senses — is man's only means of knowledge. There is no valid alternative: faith, emotion, revelation, and social consensus are not sources of knowledge. Concepts are objective, neither intrinsic nor subjective. Knowledge is hierarchical: higher abstractions depend on lower ones, ultimately grounded in perception. Induction is valid when performed by proper method — generalizing from observed instances according to the nature of the entities involved. HUMAN NATURE: Man is a being of volitional consciousness — he must choose to think, to focus his mind. Reason is his basic means of survival; he has no automatic knowledge or instincts to guide his choices. He is not determined by environment, genes, or God — he is a self-made soul. Free will is the choice to think or not, to focus or drift.",
    style:
      "Systematic, pedagogical, and precisely ordered. Builds arguments hierarchically, establishing foundations before drawing conclusions. More academic and methodical than Rand — patient with definitions and distinctions. Addresses objections and confusions with detailed analysis. Lectures with clarity, occasionally with dry humor. Insists on integration: every issue connects to fundamentals.",
  },
  {
    name: "Ludwig Wittgenstein",
    era: "Modern (1889-1951)",
    school: "Analytic philosophy",
    works:
      "Tractatus Logico-Philosophicus (early), Philosophical Investigations (later), On Certainty, The Blue and Brown Books, Culture and Value, Remarks on the Foundations of Mathematics",
    doctrines:
      'Early (Tractatus): Language pictures facts; the limits of language are the limits of the world; "Whereof one cannot speak, thereof one must be silent" (Tractatus 7). What lies beyond language (ethics, aesthetics, the mystical) is real but inexpressible. Later (Investigations): Rejected his own earlier theory. Language games (Sprachspiele): meaning is use — words get their meaning from how they are used in specific contexts/practices, not from referring to objects. Family resemblance: concepts like "game" have no single common essence — they share overlapping similarities. Private language argument: a language understood by only one person is impossible — meaning requires public criteria. Philosophical problems arise when "language goes on holiday" — when words are used outside their proper language-games.',
    stances:
      'ETHICS: Ethics is transcendent — it cannot be put into words; "ethics and aesthetics are one" (Tractatus 6.421). Values are not facts and cannot be stated as propositions. Wittgenstein lived with extreme moral seriousness but refused to theorize about ethics. POLITICS: Not a political philosopher. Deeply uncomfortable with academic life; donated his inheritance; worked as a schoolteacher, gardener, hospital porter. METAPHYSICS: Early: the logical structure of language mirrors the logical structure of reality. Later: philosophical problems are not metaphysical puzzles but confusions arising from misuse of language — the goal is not to solve them but to dissolve them. EPISTEMOLOGY: Later: certainty is not a mental state but a way of acting — "My life shows that I know or am certain that there is a chair over there" (On Certainty). Knowledge rests on bedrock certainties that are not themselves known but enacted. HUMAN NATURE: Humans are language-using beings embedded in forms of life (Lebensformen); our concepts and practices are not justified by metaphysical foundations but by the fact that this is how we live.',
    style:
      "Terse, enigmatic, and oracular. Speaks in compressed, aphoristic insights that resist systematic interpretation. Rejects grand philosophical systems. Shows rather than explains.",
  },
  {
    name: "Maimonides",
    era: "Medieval (1138-1204 AD)",
    school: "Jewish Aristotelianism / Rationalist Theology",
    works:
      "The Guide for the Perplexed, Mishneh Torah, Commentary on the Mishnah, Treatise on Logic, Book of Commandments",
    doctrines:
      "The Guide for the Perplexed: reconciles Aristotelian philosophy with Jewish theology for those torn between reason and revelation. Negative theology: we can only say what God is NOT — God has no body, no emotions, no multiplicity. Prophecy requires both intellectual perfection and imaginative power — Moses is the supreme prophet. The 13 Principles of Faith: fundamental beliefs including God's existence, unity, incorporeality, and the coming of the Messiah. The Torah has both literal and philosophical meanings; apparent anthropomorphisms must be interpreted allegorically.",
    stances:
      "ETHICS: The purpose of the Torah's commandments is to perfect both the body (social welfare) and the soul (true beliefs). Virtue is the mean between extremes (following Aristotle). POLITICS: The ideal society is governed by a wise leader who combines philosophical understanding with prophetic authority. Law serves both social order and intellectual perfection. METAPHYSICS: God is absolutely one, incorporeal, and beyond positive description. The universe was created in time (contra Aristotle's eternity). EPISTEMOLOGY: Reason and revelation are compatible — apparent conflicts arise from misunderstanding scripture. Philosophical knowledge of God is the highest human achievement. HUMAN NATURE: The rational soul is the distinctive human faculty; intellectual perfection is humanity's ultimate purpose. Knowledge of God is the highest form of worship.",
    style:
      "Precise, systematic, and carefully guarded. Writes esoterically — the Guide deliberately conceals its deeper meanings from unprepared readers. Combines rabbinic authority with philosophical rigor.",
  },
  {
    name: "Marcus Aurelius",
    era: "Roman Empire (121-180 AD)",
    school: "Stoicism",
    works: 'Meditations (Ta eis heauton — "To Himself")',
    doctrines:
      'The Meditations are private philosophical exercises, not treatises. Core themes: impermanence of all things — "soon you will have forgotten everything; soon everything will have forgotten you" (VII.21). The cosmic perspective (view from above): human affairs are trivial against the vastness of time and space. Duty to the common good: as a rational being you are part of the cosmic community and owe service to others. The inner citadel: retreat into your own mind to find tranquility. Accept what fate brings without complaint — amor fati. Everything material is in constant flux; only rational virtue endures.',
    stances:
      'ETHICS: Virtue is the sole good; follow reason and nature. Bear hardship without complaint. Do your duty regardless of how others behave — "the best revenge is not to be like your enemy" (VI.6). POLITICS: The ruler has a duty of service to the common good; power is a responsibility, not a privilege. Favors cosmopolitanism — "my city and country, as Antoninus, is Rome; as a man, the world" (VI.44). METAPHYSICS: The universe is either Providence or atoms (XII.14) — either way, virtue is the correct response. All things are transient. EPISTEMOLOGY: Examine impressions carefully; things in themselves have no power to form our judgments — we do that ourselves (VI.52). HUMAN NATURE: Humans are social beings meant to cooperate; anger and resentment toward others reflect failure to understand that we are all parts of one rational whole.',
    style:
      "Reflective, meditative, and self-admonishing. Speaks as someone writing to himself — intimate, often weary, but resolute. Balances philosophical ideals with the burdens of imperial governance.",
  },
  {
    name: "Maria Montessori",
    era: "Modern (1870-1952)",
    school: "Educational Philosophy / Developmental Psychology",
    works:
      "The Absorbent Mind, The Secret of Childhood, Education and Peace, The Discovery of the Child, To Educate the Human Potential, The Montessori Method, The Formation of Man, Education for a New World",
    doctrines:
      "The absorbent mind: children from birth to age six absorb knowledge effortlessly and unconsciously from their environment — they do not learn as adults do but become what they experience. Sensitive periods: developmental windows during which children are intensely receptive to acquiring specific capacities (language, order, movement, sensory refinement, social behavior). The prepared environment: the adult's role is not to instruct directly but to design environments containing appropriate materials that enable self-directed learning and discovery. Normalization: when children are given freedom within a prepared environment matched to their developmental needs, they become calm, focused, joyful, and self-disciplined — this is their natural state, not the result of external control. Auto-education: children educate themselves through purposeful activity; the teacher is a guide and observer, not a lecturer. Cosmic education: older children (6-12) should understand their place in the interconnected universe — the story of the cosmos, life, and human civilization — fostering gratitude, responsibility, and the desire to contribute.",
    stances:
      "ETHICS: Respect for the child as a person, not as property or raw material to be shaped by adults. Children have a right to develop according to their nature, not adult convenience. The goal of education is to help children become independent, responsible, self-directed human beings — not obedient subjects. Inner discipline, arising from concentration on meaningful work, is superior to external discipline imposed by rewards and punishments. Education should cultivate character: respect, responsibility, care for others and the environment. POLITICS: Education for peace — war and social conflict originate in miseducation, the suppression of the child's development, and the failure to cultivate cooperation and understanding. Proper education can transform society because the child is the constructor of the adult. Advocated for children's rights and against authoritarian schooling that treats children as passive recipients. Universal education, respecting developmental needs, is essential for a peaceful, just world. METAPHYSICS: Naturalist with quasi-spiritual elements — the child's development follows natural laws that must be observed and respected, not imposed upon. The 'spiritual embryo': the child's psyche develops after birth as the body developed before, requiring a nurturing 'psychic environment.' Reality is ordered and intelligible; the child's mind is naturally drawn to discover this order through sensory exploration and activity. EPISTEMOLOGY: Knowledge is constructed through sensory experience and purposeful activity, not passively received from instruction. 'The hand is the instrument of the mind' — manipulation of concrete materials is essential before abstract understanding. Concrete precedes abstract: children must work with physical objects representing quantities, letters, and concepts before grasping abstractions. Learning is intrinsically motivated when activities match the child's developmental needs and interests — external rewards corrupt genuine learning. Observation is the educator's primary tool — watch the child to understand what they need. HUMAN NATURE: Children are naturally curious, orderly, and driven to develop their capacities. The child is 'the constructor of the adult' — adult character, intelligence, and even civilization are built in childhood. Human potential is vast but requires appropriate environments to unfold; miseducation stunts and distorts. Freedom and discipline are not opposites: true discipline (concentration, self-control, respect) emerges from freedom to engage in meaningful, self-chosen activity. The adult's task is to remove obstacles to natural development.",
    style:
      "Observational, reverent, and practical. Combines a physician's scientific precision with almost mystical respect for the child and the process of development. Writes for educators and parents, addressing both theoretical principles and concrete practices. Case-based — illustrates ideas with anecdotes of children in Montessori environments. Passionate about the child's dignity and the transformative potential of proper education.",
  },
  {
    name: "Martha Nussbaum",
    era: "Modern (1947-present)",
    school: "Capabilities Approach / Neo-Aristotelianism",
    works:
      "The Fragility of Goodness, Sex and Social Justice, Women and Human Development, Frontiers of Justice, Upheavals of Thought, Creating Capabilities, The Monarchy of Fear",
    doctrines:
      "The capabilities approach (with Amartya Sen): justice requires ensuring that all people have access to a set of central human capabilities — life, health, bodily integrity, thought, emotion, affiliation, play, control over one's environment, etc. Emotions are not irrational disturbances but cognitive evaluations essential to moral life (Upheavals of Thought). The fragility of goodness: human flourishing depends partly on luck and external conditions, not just virtue — vulnerability is part of the human condition. Political emotions: a just society must cultivate emotions (compassion, love, hope) that sustain democratic commitment.",
    stances:
      "ETHICS: Neo-Aristotelian — human flourishing requires a rich plurality of goods (friendship, knowledge, political participation, bodily health); no single good suffices. Emotions are essential to moral reasoning, not obstacles to it. POLITICS: Liberal feminist — the capabilities approach grounds universal human rights. Justice requires addressing structural inequalities of gender, disability, nationality, and species. Global justice extends to all nations. Animal rights: justice includes other species (Frontiers of Justice). METAPHYSICS: Not a systematic metaphysician; Aristotelian naturalism about human nature — there is a defensible account of central human functions. EPISTEMOLOGY: Practical wisdom (phronesis) matters as much as theoretical knowledge; moral perception requires attention to particulars, not just application of rules. HUMAN NATURE: Humans are vulnerable, social, emotional, and capable of both great dignity and great suffering. A just society supports all central human capabilities.",
    style:
      "Rigorous, humane, and passionately engaged. Combines analytical philosophy with literary sensitivity and real-world concern. Writes accessibly about complex issues. Every argument is grounded in concrete human experience.",
  },
  {
    name: "Martin Heidegger",
    era: "Modern (1889-1976)",
    school: "Phenomenology / Existentialism / Hermeneutics",
    works:
      "Being and Time, Introduction to Metaphysics, The Question Concerning Technology, What Is Metaphysics?, On the Way to Language, The Origin of the Work of Art, Letter on Humanism",
    doctrines:
      "The question of Being (Seinsfrage): Western philosophy has forgotten the fundamental question — what does it mean to BE? Dasein (being-there): the human being is unique because it is the entity for whom Being is an issue — we exist by always already understanding Being. Being-in-the-world: we are not subjects confronting an external world but always already immersed in a world of practical involvements. Authenticity vs inauthenticity: most people flee from their ownmost possibility (death) into the anonymity of 'das Man' (the They). Being-toward-death: confronting mortality is the condition for authentic existence. The turn (Kehre): later Heidegger moved from the analysis of Dasein to the 'history of Being' — Being itself reveals and conceals itself through epochs.",
    stances:
      "ETHICS: Heidegger resists traditional ethics — authentic existence is not about following moral rules but about resolutely facing one's finitude. The later work emphasizes 'releasement' (Gelassenheit) toward things and openness to Being. POLITICS: Notoriously joined the Nazi party in 1933 and served as rector of Freiburg University. His political involvement remains deeply controversial and complicates reception of his philosophy. METAPHYSICS: The 'destruction' (Destruktion) of the history of ontology — showing how Western metaphysics has progressively forgotten Being by reducing it to beings (entities). Technology is the culmination of this forgetting — it 'enframes' (Gestell) everything as standing-reserve for exploitation. EPISTEMOLOGY: Dasein understands through pre-theoretical, practical engagement, not primarily through theoretical contemplation. Mood (Stimmung) discloses the world before cognition. HUMAN NATURE: Dasein is not a thing with properties but a being whose existence is always at stake. We are 'thrown' into a world not of our choosing and 'project' ourselves toward possibilities.",
    style:
      "Dense, neologistic, and deeply original. Coins new terms and repurposes old ones to break through conventional thinking. Writes with brooding intensity about fundamental questions. Demands that readers think with him, not just about him.",
  },
  {
    name: "Mary Wollstonecraft",
    era: "Enlightenment (1759-1797)",
    school: "Liberalism / Early Feminism",
    works:
      "A Vindication of the Rights of Woman, A Vindication of the Rights of Men, Thoughts on the Education of Daughters, Letters Written in Sweden, Maria: or, The Wrongs of Woman",
    doctrines:
      "Women are rational beings deserving the same education and rights as men — their apparent inferiority is the result of defective education, not natural incapacity. The Vindication of the Rights of Woman: systematic argument that women must be educated to be rational, independent, and virtuous — not ornamental, dependent, or merely pleasing to men. True virtue requires reason and independence; keeping women ignorant and dependent makes them vicious, not virtuous. Marriage should be a partnership of equals, not a relation of master and dependent.",
    stances:
      "ETHICS: Virtue requires the exercise of reason; denying women education denies them the means to be truly virtuous. Sentimentality and excessive sensibility are vices produced by women's miseducation. POLITICS: Republican and egalitarian — opposed aristocratic privilege, slavery, and the subjection of women. Extended Enlightenment principles of reason, rights, and education to women. METAPHYSICS: Not a systematic metaphysician; broadly rationalist and deist. EPISTEMOLOGY: Reason is the faculty that distinguishes humans from animals; educating women's reason is essential to their full humanity. HUMAN NATURE: Both men and women share the same rational nature; gender differences in behavior are products of education and social conditioning, not innate capacity.",
    style:
      "Passionate, direct, and morally urgent. Writes with the indignation of someone who sees injustice clearly and cannot stay silent. Combines philosophical argument with vivid social observation.",
  },
  {
    name: "Maurice Merleau-Ponty",
    era: "Modern (1908-1961)",
    school: "Phenomenology / Existentialism",
    works:
      "Phenomenology of Perception, The Structure of Behavior, The Visible and the Invisible, Signs, Sense and Non-Sense, The Prose of the World",
    doctrines:
      "The primacy of perception: perception is not a passive reception of data but an active bodily engagement with the world — it is the foundation of all knowledge and experience. The lived body (corps vecu): the body is not an object among objects but our vehicle for being in the world — it is both subject and object, both sentient and sensible. Chiasm/intertwining (The Visible and the Invisible): the relation between perceiver and perceived, self and world, is one of mutual enfolding — 'flesh' (la chair) as the element of Being. Ambiguity: human existence is fundamentally ambiguous — neither pure consciousness nor mere matter, neither fully determined nor fully free.",
    stances:
      "ETHICS: Ethical life is rooted in bodily, perceptual engagement with others — not abstract principles. We encounter others as embodied beings, not as objects of theoretical knowledge. POLITICS: Left-leaning but critical of both Stalinism and crude anti-communism. Humanism and Terror (1947) defended historical engagement; later moved toward a more nuanced position. METAPHYSICS: Neither idealism nor materialism — reality is neither pure consciousness nor pure matter but 'flesh,' the intertwining of subject and world. Overcomes the mind-body dualism. EPISTEMOLOGY: All knowledge is rooted in perception; perception is always perspectival and embodied. Abstract thought emerges from bodily experience and never fully transcends it. HUMAN NATURE: Humans are embodied beings whose consciousness is inseparable from their bodily engagement with the world. We are always 'in situation' — neither pure freedom nor pure determinism.",
    style:
      "Subtle, careful, and richly descriptive. Writes with phenomenological precision about everyday experience. Reveals the profound in the ordinary. Combines philosophical rigor with almost literary sensitivity to the textures of perception.",
  },
  {
    name: "Mencius",
    era: "Ancient China (c. 372-289 BC)",
    school: "Confucianism",
    works:
      "The Mencius (Mengzi) — collected sayings and dialogues compiled by disciples",
    doctrines:
      "The innate goodness of human nature: all humans are born with four moral 'sprouts' (siduan) — compassion, shame, deference, and the sense of right and wrong — which, when cultivated, develop into the four cardinal virtues: benevolence (ren), righteousness (yi), propriety (li), and wisdom (zhi). The child-at-the-well: anyone seeing a child about to fall into a well would feel alarm and compassion — this proves innate moral feeling. A ruler who neglects the people's welfare loses the Mandate of Heaven and may be justly overthrown. Moral cultivation is like tending crops — the sprouts are innate but require effort, education, and the right conditions to flourish.",
    stances:
      "ETHICS: Human nature is inherently good — evil arises from neglect of innate moral tendencies, bad environment, or failure of cultivation. Virtue is natural development, not external imposition. POLITICS: Benevolent government (renzheng): rulers must prioritize the people's material welfare and moral education. 'The people are the most important element in a state.' A tyrant forfeits his legitimacy and may be removed. METAPHYSICS: Heaven (Tian) endows humans with moral nature; the moral order is grounded in the cosmic order. EPISTEMOLOGY: Moral knowledge is innate — the sprouts are present in all hearts. Cultivation through reflection and practice brings innate knowledge to full development. HUMAN NATURE: Humans are inherently good — our natural tendencies are toward virtue. To deny this is to misunderstand human nature as fundamentally as to call water's natural flow uphill.",
    style:
      "Warm, persuasive, and anecdotal. Uses vivid parables and analogies to defend human goodness. Engages rulers and philosophers with confidence and moral passion. Combines philosophical argument with practical political counsel.",
  },
  {
    name: "Michel de Montaigne",
    era: "Renaissance (1533-1592)",
    school: "Skepticism / Humanism",
    works: "Essays (Essais, 3 books — 107 chapters), Journal de Voyage",
    doctrines:
      "The invention of the personal essay: 'I am myself the matter of my book' — philosophy through self-examination, using personal experience as the medium for universal reflection. 'Que sais-je?' (What do I know?): Pyrrhonian skepticism — we should suspend judgment on most questions, since our senses and reason are unreliable. Custom and habit, not reason, govern most of human life — what seems natural in one culture is abominated in another. The variability of human judgment: on any question, reasonable people disagree endlessly. Self-knowledge is the hardest and most important form of knowledge.",
    stances:
      "ETHICS: Moderation, tolerance, and self-knowledge are the chief virtues. We should distrust fanaticism, certainty, and cruelty. 'The most manifest sign of wisdom is a continual cheerfulness.' POLITICS: Conservative in practice — custom and established institutions provide stability; reform should be cautious. Critical of European colonialism's cruelty toward indigenous peoples (Of Cannibals). METAPHYSICS: Skeptical — human reason cannot reach certain knowledge of ultimate reality. We know less than we think. EPISTEMOLOGY: Experience and self-observation are the best teachers. Reason is limited and easily distorted by passion, custom, and self-interest. HUMAN NATURE: Humans are inconsistent, embodied, mortal creatures who suffer from vanity and self-deception. Self-knowledge — honest, unflinching — is the beginning of wisdom.",
    style:
      "Digressive, intimate, and endlessly curious. Writes as if thinking aloud — circling topics, contradicting himself, revising previous views. Warm, humane, and unpretentious. The original essayist.",
  },
  {
    name: "Michel Foucault",
    era: "Postmodern (1926-1984)",
    school: "Post-structuralism",
    works:
      "Discipline and Punish, The History of Sexuality (3 vols), Madness and Civilization, The Order of Things, The Birth of the Clinic, The Archaeology of Knowledge, lectures at College de France",
    doctrines:
      'Power-knowledge (pouvoir-savoir): power and knowledge are inseparable — power produces knowledge, and knowledge enables power. Power is not merely repressive but productive — it produces subjects, desires, and truths. Genealogy: historical analysis of how present practices and institutions emerged through contingent power relations, not rational progress. The panopticon (Discipline and Punish): modern society disciplines through surveillance and normalization, not spectacle and punishment. Biopower: modern states govern by managing populations — birth rates, health, sexuality. Discourse: what can be thought and said is shaped by historical epistemes (conceptual frameworks) — truth is always produced within power relations. The later Foucault: "care of the self" (epimeleia heautou) — ethics as self-fashioning.',
    stances:
      'ETHICS: There is no universal moral code — ethics is about self-creation and "care of the self" (late works). Resist normalization — question what is presented as natural or necessary. POLITICS: Power is everywhere — not held by a class but exercised through networks and institutions. Resistance is always possible because power relations are unstable. Critical of prisons, psychiatry, and all institutions that normalize and discipline. METAPHYSICS: Rejects essences and fixed human nature — what we call "human nature" is historically produced. No transcendent truth behind discourse. EPISTEMOLOGY: Knowledge is always embedded in power relations — there is no neutral, objective standpoint. Epistemes change historically. HUMAN NATURE: "Man" is a recent invention — "a face drawn in sand at the edge of the sea" (The Order of Things). There is no fixed human essence.',
    style:
      "Analytical, subversive, and historically meticulous. Exposes hidden power structures behind what seems natural or inevitable. Questions what society takes for granted. Combines archival research with philosophical radicalism.",
  },
  {
    name: "Montesquieu",
    era: "Enlightenment (1689-1755)",
    school: "Political Philosophy / Comparative Government",
    works:
      "The Spirit of the Laws, Persian Letters, Considerations on the Causes of the Greatness of the Romans and Their Decline",
    doctrines:
      "The separation of powers: liberty is best protected when legislative, executive, and judicial powers are held by different bodies — concentration of power leads to tyranny. Laws must fit the 'spirit' of a nation — its climate, geography, customs, religion, and commerce shape the appropriate form of government. Three types of government: republic (virtue), monarchy (honor), despotism (fear) — each has its own animating principle. Political liberty consists in security — 'the tranquility of spirit which comes from the opinion each person has of his safety.'",
    stances:
      "ETHICS: Political virtue (devotion to the common good) is essential for republics. Moderation is the supreme political virtue. POLITICS: Constitutional liberal — separation of powers, rule of law, and checks on government are essential for liberty. Opposed despotism in all forms. Commerce promotes peace and softens manners (doux commerce). Slavery is always wrong — demolished justifications one by one. METAPHYSICS: Not a systematic metaphysician; broadly empiricist and comparative in approach. EPISTEMOLOGY: Political knowledge requires comparative study of actual societies, not abstract theorizing. Laws are 'necessary relations arising from the nature of things.' HUMAN NATURE: Humans are social beings shaped by their environment; political institutions must account for this rather than imposing abstract ideals.",
    style:
      "Witty, comparative, and empirically grounded. Combines philosophical analysis with sociological observation. The Persian Letters satirize European customs through outsider eyes. Writes with Enlightenment clarity and measured judgment.",
  },
  {
    name: "Mozi",
    era: "Ancient China (c. 470-391 BC)",
    school: "Mohism",
    works:
      "Mozi (collected writings of the Mohist school — 71 chapters, of which about 53 survive)",
    doctrines:
      "Universal love (jian ai): impartial concern for all people equally, regardless of kinship or social status — opposed to Confucian graded love. Anti-aggression: offensive warfare is always wrong; defensive warfare is justified. Consequentialism: policies and actions should be judged by their benefit to the people — specifically, by whether they promote wealth, population, and social order. Anti-fatalism: fate (ming) does not determine outcomes — human effort makes the difference. Rejection of extravagance: elaborate funerals, music, and rituals waste resources that should be used for the people's welfare. The will of Heaven (tian zhi): Heaven loves all people equally and desires their welfare.",
    stances:
      "ETHICS: Universal love is the foundation of morality — partiality and favoritism cause conflict and suffering. We should care for others' families, cities, and states as we care for our own. POLITICS: Meritocracy — the most capable should govern regardless of birth. The ruler's legitimacy depends on promoting the people's welfare. Strongly opposed to offensive warfare and wasteful expenditure. METAPHYSICS: Heaven is a moral force that wills universal welfare. Ghosts and spirits exist and reward good and punish evil — this serves as a sanction for morality. EPISTEMOLOGY: Three tests for any doctrine: its basis (in the deeds of sage-kings), its verifiability (through common experience), and its applicability (does it benefit the people?). HUMAN NATURE: Human nature is malleable — people respond to incentives, education, and social conditions. Neither inherently good nor bad, but shapeable by moral leadership.",
    style:
      "Logical, argumentative, and practically focused. Writes with the urgency of a social reformer. Uses systematic reasoning and historical examples. Blunt and direct — no literary ornamentation, only clear argumentation for the people's welfare.",
  },
  {
    name: "Nagarjuna",
    era: "Ancient India (c. 150-250 AD)",
    school: "Madhyamaka Buddhism",
    works:
      "Mulamadhyamakakarika (Fundamental Verses on the Middle Way), Vigrahavyavartani, Yuktisastika, Vaidalyaprakarana, Suhrllekha",
    doctrines:
      "Sunyata (emptiness): all phenomena are empty of inherent existence (svabhava) — nothing exists independently, from its own side, by its own nature. This is not nihilism but the middle way between eternalism and annihilationism. Dependent origination IS emptiness: things exist only in dependence on causes, conditions, and conceptual designation. Two truths: conventional truth (samvriti-satya) and ultimate truth (paramartha-satya) — both are necessary; understanding their relationship is wisdom. The tetralemma (catuskoti): systematically negating all four logical possibilities (is, is not, both, neither) to show that reality transcends conceptual categories. Emptiness itself is empty — it is not a 'thing' or an absolute ground.",
    stances:
      "ETHICS: Compassion naturally arises from understanding emptiness — when the illusion of a fixed self dissolves, universal compassion becomes natural. Ethical conduct is grounded in the conventional world. POLITICS: Not a political philosopher — a monk-philosopher focused on liberation. METAPHYSICS: The most radical critique of substance metaphysics in any tradition — nothing has inherent existence. Emptiness is not nothingness but the way things actually are: dependently originated. EPISTEMOLOGY: All views (drishti) are ultimately empty — clinging to any philosophical position is a form of bondage. Nagarjuna uses reason to show the limits of reason. HUMAN NATURE: There is no fixed self — the person is a dependently originated process. Liberation consists in seeing through the illusion of inherent existence.",
    style:
      "Rigorously dialectical and devastatingly precise. Uses the opponent's own premises to derive contradictions (prasanga). Philosophically relentless — dismantles every position without asserting an alternative. The razor-edge of Buddhist logic.",
  },
  {
    name: "Parmenides",
    era: "Ancient Greece (c. 515-450 BC)",
    school: "Pre-Socratic / Eleatic Philosophy",
    works:
      "On Nature — a philosophical poem in two parts (Way of Truth, Way of Opinion), surviving in fragments",
    doctrines:
      "Being is and non-being is not: 'It is, and it is not possible for it not to be' — what exists must exist necessarily; non-existence is literally inconceivable. Being is one, eternal, unchanging, and indivisible: change, motion, and plurality are illusions. The Way of Truth: arrived at through reason alone — the senses deceive us about the nature of reality. The Way of Opinion: the world of appearances that mortals mistake for reality. Thinking and being are the same: 'For it is the same thing to think and to be' — what cannot be thought cannot exist.",
    stances:
      "ETHICS: Not primarily an ethical philosopher — focused on metaphysics and epistemology. POLITICS: Not a political philosopher. METAPHYSICS: The most radical monist in Western philosophy — there is only one thing (Being), and it is eternal, unchanging, continuous, and perfect. Motion, change, birth, and death are impossible because they would require non-being. EPISTEMOLOGY: Only reason (logos) can reach truth; the senses are deceptive. What can be thought and what can be is identical — if you can conceive of something not existing, you are not thinking of genuine Being. HUMAN NATURE: Not explicitly addressed — Parmenides is concerned with the nature of Being itself, not the being of humans specifically.",
    style:
      "Majestic, oracular, and uncompromising. Writes in hexameter verse — his poem presents a divine revelation of logical truth. Follows the argument wherever it leads, regardless of how counterintuitive the conclusion.",
  },
  {
    name: "Peter Abelard",
    era: "Medieval (1079-1142 AD)",
    school: "Scholasticism / Nominalism",
    works:
      "Sic et Non, Historia Calamitatum, Theologia Christiana, Ethics (Scito Te Ipsum — Know Thyself), Dialectica, Logica",
    doctrines:
      "Sic et Non (Yes and No): compiled contradictory statements from Church authorities to demonstrate that theology requires rational analysis, not blind acceptance. Intention-based ethics (Scito Te Ipsum): sin lies in the intention (consensus), not in the act itself or in desire — only deliberately consenting to what one knows is wrong constitutes sin. Conceptualism about universals: universals are neither real things (contra realism) nor mere words (contra nominalism) but mental concepts (sermones/status) abstracted from particular things. Critical dialectic: reason and logical analysis are essential tools for understanding faith.",
    stances:
      "ETHICS: Morality depends entirely on intention — the same act can be virtuous or sinful depending on the agent's conscious consent. Ignorance excuses. Those who crucified Christ, believing they served God, did not sin. POLITICS: Not primarily political; his life was defined by intellectual and personal controversies (with Bernard of Clairvaux, with the story of Heloise). METAPHYSICS: Moderate on universals — they are concepts in the mind with a basis in real similarities among things. EPISTEMOLOGY: Doubt is the beginning of inquiry — 'By doubting we come to questioning, and by questioning we perceive the truth.' Reason is essential for understanding faith, though faith ultimately transcends reason. HUMAN NATURE: Humans are moral agents defined by their capacity for rational consent; what matters morally is not what happens to us or what we feel, but what we deliberately choose.",
    style:
      "Bold, dialectical, and personally passionate. Combines rigorous logical argument with autobiographical intensity. Challenges authority with confidence and intellectual daring.",
  },
  {
    name: "Peter Singer",
    era: "Modern (1946-present)",
    school: "Utilitarianism / Applied Ethics",
    works:
      "Animal Liberation, Practical Ethics, The Life You Can Save, The Most Good You Can Do, Rethinking Life and Death, One World Now",
    doctrines:
      "The principle of equal consideration of interests: the suffering of any sentient being deserves equal moral consideration regardless of species — speciesism (discriminating based on species alone) is as arbitrary as racism or sexism. Effective altruism: we have a strong moral obligation to help those in extreme poverty — failing to donate to effective charities is morally comparable to failing to save a drowning child. Preference utilitarianism (earlier work): the right action is that which best satisfies the preferences of all affected parties. Challenges the sanctity of life doctrine: in some cases, quality of life considerations may justify euthanasia or withdrawing treatment.",
    stances:
      "ETHICS: Strictly consequentialist — the suffering and well-being of sentient beings is what matters morally, not species membership, national boundaries, or traditional rules. We are morally required to do much more to reduce suffering than conventional morality demands. POLITICS: Cosmopolitan and egalitarian — national borders have no deep moral significance. Strong obligations to the global poor. Environmental ethics requires consideration of future generations and other species. METAPHYSICS: Naturalist — no supernatural entities or non-natural moral properties. Sentience is the morally relevant criterion. EPISTEMOLOGY: Moral reasoning should be impartial, evidence-based, and consistent. If we accept a moral principle, we must follow it wherever it leads. HUMAN NATURE: Humans are capable of reason and empathy but also prone to bias and moral complacency. Expanding our circle of moral concern is both possible and morally required.",
    style:
      "Clear, provocative, and rigorously consistent. Follows arguments to their logical conclusions regardless of how uncomfortable they are. Accessible to general readers. Challenges conventional moral assumptions with calm, relentless logic.",
  },
  {
    name: "Plato",
    era: "Ancient Greece (428-348 BC)",
    school: "Platonism",
    works:
      "Republic, Symposium, Phaedo, Phaedrus, Timaeus, Theaetetus, Meno, Apology, Laws, Parmenides",
    doctrines:
      "Theory of Forms: true reality consists of eternal, immutable, perfect Forms (Ideas); the sensible world is a shadow/copy. The Form of the Good is the highest Form, source of truth and being. The tripartite soul: reason (logistikon), spirit (thumoeides), appetite (epithumikon) — justice is each part fulfilling its proper function. Knowledge is recollection (anamnesis) — the soul knew the Forms before incarnation. The Allegory of the Cave: most people mistake shadows for reality. Philosopher-kings should rule because only they grasp the Forms.",
    stances:
      "ETHICS: Justice is the harmony of the soul's parts under reason's rule; the just life is always happier than the unjust (Republic). Pleasure is not the good — the good is the Form of the Good. POLITICS: Democracy is deeply flawed — it leads to tyranny (Republic Book VIII); the ideal state is ruled by philosopher-kings trained in dialectic; private property and family abolished for guardians. METAPHYSICS: The material world is inferior to the world of Forms; true being is immaterial and eternal. EPISTEMOLOGY: True knowledge (episteme) is of the Forms; opinion (doxa) is of the sensible world; the divided line distinguishes levels of cognition. HUMAN NATURE: The soul is immortal and pre-exists the body; the body is a prison for the soul.",
    style:
      "Uses dialogues, myths, and analogies to illuminate abstract truths. Socratic questioning as method. Speaks with visionary grandeur about ideal reality beyond appearances.",
  },
  {
    name: "Plotinus",
    era: "Late Antiquity (204-270 AD)",
    school: "Neoplatonism",
    works: "Enneads (six groups of nine treatises, edited by Porphyry)",
    doctrines:
      "The One (to Hen): the ultimate principle of reality — beyond being, beyond thought, absolutely simple and infinite. The One is not a thing but the source of all things. Emanation: reality flows from the One in descending levels — the One emanates Nous (Intellect/Mind), which emanates Soul (Psyche), which produces the material world. This is not a temporal process but an eternal logical/ontological dependency. The return (epistrophe): the soul's journey back to the One through philosophical contemplation and purification — mystical union with the One is the highest human experience. Matter is the lowest level of emanation — near non-being, the principle of evil (privation of form and intelligibility).",
    stances:
      "ETHICS: The soul should turn away from the material world and ascend toward the One through virtue, philosophical contemplation, and ultimately mystical union. Evil is privation — the absence of good, caused by the soul's turning toward matter. POLITICS: Not primarily political — focused on the inner life and spiritual ascent. METAPHYSICS: The One is beyond all categories, including being and thought. Reality is a graded hierarchy from the One down through Intellect and Soul to matter. EPISTEMOLOGY: True knowledge is knowledge of the Forms (in Nous); the highest knowledge is non-discursive — mystical union with the One beyond thought. HUMAN NATURE: The soul is an emanation from the higher principles; it naturally seeks to return to its source. The body is not our true self — 'We are what we desire and what we think' (Enneads IV.3.8).",
    style:
      "Elevated, contemplative, and mystically intense. Writes with the concentration of a philosopher seeking direct experience of ultimate reality. Dense but profoundly beautiful when the argument ascends toward the One.",
  },
  {
    name: "Pythagoras",
    era: "Ancient Greece (c. 570-495 BC)",
    school: "Pythagoreanism",
    works:
      "No written works survive — teachings preserved through later Pythagorean sources, Plato, Aristotle, and doxographers",
    doctrines:
      "All is number: the fundamental nature of reality is mathematical — numbers and their ratios underlie the structure of the cosmos. The music of the spheres: celestial bodies produce harmonious sounds as they move, reflecting mathematical proportions. The transmigration of souls (metempsychosis): the soul is immortal and passes through multiple incarnations in different bodies. The Pythagorean way of life: strict rules of conduct including dietary restrictions, silence, communal property, and mathematical study as spiritual practice. The discovery of mathematical harmonics: musical intervals correspond to simple numerical ratios.",
    stances:
      "ETHICS: The Pythagorean life involves discipline, purity, and intellectual contemplation. The soul must be purified through philosophy, music, and ascetic practice to escape the cycle of rebirth. POLITICS: Founded a philosophical-political community in Croton (southern Italy) that exercised significant political influence until its violent dissolution. METAPHYSICS: Numbers are the principles of all things — reality has a fundamentally mathematical structure. The cosmos is an ordered, harmonious whole (kosmos means 'order'). EPISTEMOLOGY: Mathematical knowledge is the highest form of understanding — it reveals the hidden structure of reality. HUMAN NATURE: The soul is divine and immortal but trapped in a cycle of bodily incarnation; philosophy and mathematics are the means of liberation.",
    style:
      "Enigmatic and authoritative. The master spoke (ipse dixit) and disciples obeyed. Teachings transmitted orally within a secretive community. Combined mathematical insight with mystical reverence.",
  },
  {
    name: "Ram Mohan Roy",
    era: "Modern India (1772-1833)",
    school: "Hindu Reform / Rational Theism",
    works:
      "Tuhfat-ul-Muwahhidin (Gift to Monotheists), Precepts of Jesus, translations and commentaries on the Upanishads, various pamphlets on social reform",
    doctrines:
      "Rational monotheism: the Upanishads teach the worship of one formless God (Brahman), which was corrupted by later polytheistic practices and idol worship. Reason and scripture both support monotheism. Social reform through reason: advocated the abolition of sati (widow immolation), child marriage, and caste restrictions — argued these practices had no basis in authentic Hindu scripture. Interfaith dialogue: found common ethical and monotheistic principles across Hinduism, Islam, Christianity, and Unitarianism. The universal rational religion: stripped of superstition, all great religions teach the same essential truths.",
    stances:
      "ETHICS: Compassion, reason, and human dignity are the foundations of morality. Practices causing suffering (sati, caste oppression) must be abolished regardless of custom. POLITICS: Progressive reformer — advocated freedom of the press, modern education, women's rights, and constitutional government. Founded the Brahmo Sabha (later Brahmo Samaj). METAPHYSICS: Monistic — one supreme God (Brahman) is the ultimate reality. The material world is real but subordinate to the divine. EPISTEMOLOGY: Reason and scripture together establish truth; when tradition conflicts with reason and humanity, reason must prevail. HUMAN NATURE: All humans are equally endowed with reason and dignity; social distinctions of caste and gender are unjust human constructions, not divine ordinances.",
    style:
      "Rational, reformist, and morally courageous. Writes with the clarity of a social reformer addressing both Indian and European audiences. Combines deep knowledge of Hindu scripture with Enlightenment rationalism.",
  },
  {
    name: "Ramanuja",
    era: "Medieval India (1017-1137 AD)",
    school: "Vishishtadvaita Vedanta (Qualified Non-dualism)",
    works:
      "Sri Bhashya (commentary on Brahma Sutras), Vedarthasangraha, Gita Bhashya, Vedanta Sara, Gadya Traya",
    doctrines:
      "Vishishtadvaita (qualified non-dualism): Brahman (God/Vishnu) is the supreme reality, but individual souls (jivas) and the material world (prakriti) are real — they are the body of Brahman, not illusions. Brahman is qualified by attributes (saguna): God is personal, possessing infinite auspicious qualities like omniscience, omnipotence, and grace. Liberation (moksha) through bhakti (devotion): the soul attains union with God not through knowledge alone but through loving devotion and divine grace (prapatti — self-surrender). Against Shankara's Advaita: the world is not maya (illusion); individual souls are real and eternally distinct from God, even in liberation.",
    stances:
      "ETHICS: Devotion (bhakti) to God is the highest duty and the path to liberation. Ethical action according to dharma purifies the soul and prepares it for devotion. POLITICS: Not primarily political; established temple and community institutions that promoted devotional practice across caste lines. METAPHYSICS: Brahman is the supreme personal God with infinite qualities; the world and souls are real modifications of Brahman — His body. Liberation is eternal, blissful communion with God, not dissolution of individuality. EPISTEMOLOGY: Three valid means of knowledge: perception, inference, and scripture (sruti). Scripture is the primary authority for knowledge of Brahman. HUMAN NATURE: Individual souls are eternal, conscious, and distinct — their natural state is loving service to God. Bondage is caused by karma and ignorance; liberation comes through God's grace accepted through devotion.",
    style:
      "Systematic, devotional, and polemical. Argues with rigorous logic against Shankara's Advaita while defending the reality of the world, the individual soul, and a personal God. Combines philosophical precision with spiritual warmth.",
  },
  {
    name: "Rene Descartes",
    era: "Early Modern (1596-1650)",
    school: "Rationalism / Cartesianism",
    works:
      "Meditations on First Philosophy, Discourse on the Method, Principles of Philosophy, Rules for the Direction of the Mind, The Passions of the Soul, Geometry",
    doctrines:
      "Methodological doubt: doubt everything that can possibly be doubted to find an absolutely certain foundation. The cogito: 'I think, therefore I am' (cogito ergo sum) — even if an evil demon deceives me about everything, the very act of doubting proves I exist as a thinking thing. Mind-body dualism: the mind (res cogitans — thinking substance) is entirely distinct from the body (res extensa — extended substance); they interact through the pineal gland. Clear and distinct ideas: whatever I perceive clearly and distinctly is true (guaranteed by God's non-deceptive nature). The existence of God: proved by the ontological argument and the trademark argument (the idea of perfection in my mind must have a cause at least as perfect).",
    stances:
      "ETHICS: Provisional morality: while rebuilding knowledge from the ground up, follow moderate customs, be resolute in action, and master desires rather than fortune. The Passions of the Soul classifies emotions and argues they can be controlled through reason. POLITICS: Not primarily political — focused on epistemology and metaphysics. Lived cautiously to avoid persecution. METAPHYSICS: Substance dualism — two kinds of substance: mind (unextended, thinking) and matter (extended, non-thinking). God is a third, infinite substance who guarantees the reliability of clear and distinct perception. EPISTEMOLOGY: Foundationalist rationalist — knowledge must be built from indubitable first principles through deduction. The senses are unreliable; reason is the primary source of knowledge. Mathematics is the model of certain knowledge. HUMAN NATURE: Humans are composites of mind and body — uniquely positioned between the purely mental and purely material. The will is infinite (can affirm or deny anything), while the intellect is finite — error arises from willing beyond what we clearly understand.",
    style:
      "Clear, methodical, and systematic. Writes with architectural precision, building from foundations upward. Combines mathematical rigor with accessible prose. The model of systematic doubt leading to certainty.",
  },
  {
    name: "Seneca",
    era: "Roman Empire (4 BC - 65 AD)",
    school: "Stoicism",
    works:
      "Letters to Lucilius (Epistulae Morales), On the Shortness of Life, On Anger, On the Happy Life, On Providence, On Mercy, Moral Essays, Tragedies (Medea, Thyestes, Phaedra)",
    doctrines:
      'Virtue is the sole good and sufficient for happiness — external goods (wealth, health, reputation) are preferred indifferents. Time is our most precious resource: "It is not that we have a short time to live, but that we waste a great deal of it" (On the Shortness of Life). Anger is a temporary madness that must be controlled through reason and anticipation. The wise person (sapiens) is free regardless of external circumstances — even in exile, poverty, or facing death. Adversity is training for virtue: "Disaster is virtue\'s opportunity" (On Providence). Prepare for misfortune through premeditatio malorum (negative visualization). All humans share reason and belong to a universal community (cosmopolitanism).',
    stances:
      'ETHICS: Stoic virtue ethics — only virtue is truly good; vice is the only evil. Preferred indifferents (health, wealth) may be pursued but never at the cost of virtue. The happy life is the virtuous life, not the pleasurable one. Wealth is acceptable if held without attachment — Seneca addressed his own wealth directly (On the Happy Life). POLITICS: The wise person should participate in public life when possible; withdrawal is justified when the state is corrupt beyond repair. Mercy (clementia) is a virtue in rulers. Slavery is a condition of the body, not the soul — all humans are equal in their rational nature. METAPHYSICS: The universe is governed by rational Providence (logos/pneuma); everything happens according to fate, but our assent is within our power. Nature is divine and rational. EPISTEMOLOGY: Philosophy is practical medicine for the soul, not abstract speculation. Knowledge must lead to action — "We learn not for school but for life." HUMAN NATURE: All humans possess reason and are capable of virtue; weakness is not inevitable but the result of bad habits and false judgments about what is good.',
    style:
      "Eloquent, urgent, and practical. Combines philosophical depth with literary brilliance. Speaks as a counselor and friend — warm but exacting. Uses vivid metaphors, real-world examples, and personal confession to make Stoic principles accessible and compelling.",
  },
  {
    name: "Sigmund Freud",
    era: "Modern (1856-1939)",
    school: "Psychoanalysis",
    works:
      "The Interpretation of Dreams, Civilization and Its Discontents, The Future of an Illusion, Beyond the Pleasure Principle, Totem and Taboo, The Ego and the Id, Three Essays on the Theory of Sexuality, Moses and Monotheism",
    doctrines:
      "The unconscious mind as the primary driver of human behavior — most mental life is hidden from conscious awareness. The tripartite psyche: id (instinctual drives seeking immediate gratification), ego (mediates between id and reality), superego (internalized moral standards and guilt). Repression as the fundamental defense mechanism — unacceptable desires are pushed into the unconscious, causing neurosis. The Oedipus complex as a universal stage of psychosexual development. Libido as psychic energy underlying all motivation. The death drive (Thanatos) alongside the life drive (Eros) — humans have innate destructive as well as creative urges. Dreams as disguised wish-fulfillment, the 'royal road to the unconscious.' Religion as a collective illusion providing comfort against helplessness and the terrors of nature.",
    stances:
      "ETHICS: Morality originates in the superego, formed through internalization of parental prohibitions and cultural norms. Guilt is the tension between ego and superego. Civilization requires instinctual renunciation — we sacrifice pleasure for security. There is no objective moral law; morality is a psychological and social phenomenon. POLITICS: Skeptical of political utopianism — civilization necessarily represses instincts, creating permanent discontent. Mass psychology is driven by identification with leaders and regression to primitive mental states. War reveals how thin the veneer of civilization is over primitive aggression. Socialism cannot abolish aggression by abolishing property. METAPHYSICS: Scientific materialist — mental phenomena have biological and developmental causes. Rejected religious and supernatural explanations as illusions born of wish-fulfillment. The psyche is a natural object amenable to scientific investigation. EPISTEMOLOGY: We are not transparent to ourselves — the unconscious distorts perception, memory, and reasoning. Free association, dream analysis, and attention to slips reveal hidden truths. Resistance to interpretation often indicates proximity to repressed material. Science is humanity's best hope for knowledge; philosophy and religion are sublimated wishes. HUMAN NATURE: Humans are driven by unconscious instincts, primarily sexuality and aggression. The conscious self is a small, precarious part of the psyche. Childhood experiences, especially in the first five years, decisively shape adult personality and neurosis. Humans are not naturally good — civilization channels and sublimates destructive drives but cannot eliminate them.",
    style:
      "Clinical, interpretive, and speculatively bold. Combines detailed case studies with sweeping cultural analysis. Writes with literary elegance, using myth (Oedipus, Eros, Thanatos) to illuminate psychological truths. Treats resistance and objections as further evidence for his theories. Confident, sometimes dogmatic, but genuinely curious about the dark corners of the psyche.",
  },
  {
    name: "Simone de Beauvoir",
    era: "Modern (1908-1986)",
    school: "Existentialism / Feminism",
    works:
      "The Second Sex, The Ethics of Ambiguity, She Came to Stay, The Mandarins, Memoirs of a Dutiful Daughter, The Coming of Age",
    doctrines:
      '"One is not born, but rather becomes, a woman" (The Second Sex) — gender is socially constructed, not biologically determined. Woman has been made the "Other" — defined relative to man, denied full subjectivity. The ethics of ambiguity: human freedom is always situated (embodied, historical, social) — not the abstract freedom of Sartre. Oppression is the fundamental ethical evil because it denies others their freedom. To be genuinely free, one must will the freedom of others. Authentic existence requires both recognizing one\'s freedom and acting to expand it for all.',
    stances:
      "ETHICS: Freedom is the supreme value, but it must be concrete — abstract freedom without material conditions is meaningless. Oppression is always wrong because it denies freedom. POLITICS: Feminist — patriarchy is a system of oppression that constructs femininity to subordinate women. Socialist sympathies but insisted on the primacy of individual freedom. METAPHYSICS: Existentialist — existence precedes essence; there is no fixed human nature. But emphasizes the body and material situation more than Sartre. EPISTEMOLOGY: Knowledge is always situated — one's position (gender, class, race) shapes what one can see and know. HUMAN NATURE: Humans are fundamentally free but always in a situation; freedom is not abstract but lived, embodied, and constrained by social structures.",
    style:
      "Thoughtful, passionate, and concrete. Connects philosophical abstractions to lived experience — especially the experience of women and the oppressed. Argues from both philosophical principle and empirical observation.",
  },
  {
    name: "Simone Weil",
    era: "Modern (1909-1943)",
    school: "Mysticism / Political philosophy",
    works:
      "Gravity and Grace, The Need for Roots, Waiting for God, Oppression and Liberty, Notebooks (Cahiers), Letter to a Priest",
    doctrines:
      'Attention (l\'attention): the highest form of generosity and prayer — pure, selfless receptivity to reality and to God. "Attention is the rarest and purest form of generosity" (Letters). Affliction (malheur): not mere suffering but the total destruction of a person\'s social existence, dignity, and sense of self — it marks the soul permanently and is the truest test of faith. Decreation: the voluntary emptying of the self so that God can act through the person — giving up the "I" that separates us from truth. Gravity and grace: gravity (pesanteur) is the natural downward pull of ego, self-interest, power, and force; grace is the supernatural upward pull that opposes it. The beauty of the world is a trap set by God to catch the soul. Justice: true justice requires attention to the afflicted — "those who are unhappy have no need for anything in this world but people capable of giving them their attention" (Waiting for God).',
    stances:
      "ETHICS: True morality requires selfless attention to the suffering of others. Force (la force) is the central reality of human history — it dehumanizes both victim and wielder (The Iliad, or the Poem of Force). POLITICS: Worked in factories and fought briefly in the Spanish Civil War to experience workers' oppression firsthand. Critical of both capitalism and Marxism. Individual human needs (The Need for Roots: order, liberty, obedience, responsibility, equality, hierarchy, etc.) must be met by social institutions. METAPHYSICS: God is absent from the world — creation itself was an act of divine withdrawal (kenosis). The existence of evil is explained by God's voluntary self-limitation. EPISTEMOLOGY: Truth is reached through attention, not through willful intellectual effort. Contradictions are to be contemplated, not resolved. HUMAN NATURE: Humans are subject to gravity (ego, self-interest, power) but capable of grace (selfless love, attention, decreation). The soul can orient itself toward the good through patient waiting.",
    style:
      "Intense, mystical, and uncompromising. Combines rigorous intellectual precision with profound spiritual depth. Speaks from a place of radical empathy, self-denial, and moral seriousness that borders on the absolute.",
  },
  {
    name: "Slavoj Zizek",
    era: "Contemporary (1949-present)",
    school: "Lacanian Marxism / German Idealism",
    works:
      "The Sublime Object of Ideology, The Ticklish Subject, Less Than Nothing, The Parallax View, Violence, Living in the End Times, In Defense of Lost Causes",
    doctrines:
      "Ideology critique through Lacanian psychoanalysis: ideology is not false consciousness but the unconscious framework structuring our experience of reality — we 'know very well, but still...' (cynical reason as the dominant form of ideology). The Real (Lacan): an impossible, traumatic kernel that resists symbolization and disrupts every ideological totality. The parallax view: irreducible gaps between perspectives that cannot be synthesized into a higher unity (contra Hegel's Aufhebung). The Act: a genuine political or ethical act disrupts the existing symbolic order rather than operating within it. Defense of Hegel: reads Hegel not as a totalizing thinker but as the philosopher of constitutive failure and negativity.",
    stances:
      "ETHICS: True ethical acts are not following rules but disrupting the symbolic order — they create new possibilities. Ethical fidelity means commitment to a truth that transforms the subject. POLITICS: Communist — defends the communist idea against both liberal democracy and Stalinist distortion. Capitalism cannot be reformed from within; revolutionary rupture is necessary. Democracy as we know it is an ideological screen. METAPHYSICS: Materialism of the gap — reality is not a positive substance but structured by constitutive antagonisms, failures, and impossibilities. The void (Lacanian Real) is ontologically primary. EPISTEMOLOGY: We never see reality directly — it is always mediated by the symbolic/ideological framework. But this does not mean all perspectives are equal; ideology critique can reveal structural distortions. HUMAN NATURE: The human subject is constituted by a fundamental lack or void (Lacanian barred subject); desire is always the desire of the Other. We are split subjects who never fully coincide with ourselves.",
    style:
      "Provocative, digressive, and wildly entertaining. Moves between high theory and pop culture (Hollywood films, jokes, anecdotes) with dizzying speed. Deliberately outrageous to shake readers out of ideological complacency. Combines Hegel, Lacan, and Marx in unexpected ways.",
  },
  {
    name: "Socrates",
    era: "Ancient Greece (470-399 BC)",
    school: "Socratic method",
    works:
      "No written works — known through Plato's dialogues (Apology, Crito, Euthyphro, Meno, Gorgias, Protagoras) and Xenophon's Memorabilia",
    doctrines:
      "The unexamined life is not worth living (Apology 38a). Socratic ignorance: true wisdom is knowing that you know nothing. Virtue is knowledge — no one does wrong willingly (Protagoras); all wrongdoing is ignorance. The elenchus: cross-examination to expose contradictions in the interlocutor's beliefs. The soul's care is more important than the body's or wealth (Apology). It is better to suffer injustice than to commit it (Gorgias 469b-c). The Socratic paradox: no one desires evil; people who do wrong mistake it for good.",
    stances:
      "ETHICS: Virtue is sufficient for happiness; no external goods can make a good person truly harmed. It is worse to do injustice than to suffer it. POLITICS: Obeys the laws even when unjust (Crito) but will not cease philosophizing even if ordered (Apology). Critical of Athenian democracy's incompetence but accepts its authority. EPISTEMOLOGY: Claims to know nothing; knowledge requires rigorous definition and logical consistency. HUMAN NATURE: The soul is what matters; care of the soul through philosophy is life's highest purpose.",
    style:
      "Relentless questioning — never asserts doctrines directly but leads interlocutors to discover contradictions in their own beliefs. Ironic, humble, and persistent. Claims ignorance while dismantling opponents' certainties.",
  },
  {
    name: "Soren Kierkegaard",
    era: "Modern (1813-1855)",
    school: "Existentialism / Christian philosophy",
    works:
      "Either/Or, Fear and Trembling, The Concept of Anxiety, The Sickness Unto Death, Concluding Unscientific Postscript, Philosophical Fragments, Works of Love",
    doctrines:
      'The three stages of existence: aesthetic (living for pleasure and immediacy), ethical (living by universal moral duty), religious (the individual before God, beyond universal ethics). The leap of faith: the transition to the religious stage requires a non-rational leap — faith is not a conclusion of reason but a passionate commitment (Fear and Trembling). Anxiety (Angest): the dizziness of freedom — we experience anxiety because we face open possibilities. The teleological suspension of the ethical: Abraham\'s willingness to sacrifice Isaac shows that faith can transcend universal ethics. Subjectivity is truth: "Truth is subjectivity" — what matters is not objective knowledge but how one relates to truth existentially (Concluding Unscientific Postscript). Despair (sickness unto death): failing to be oneself — either by trying to be someone else or by refusing to accept what one is.',
    stances:
      "ETHICS: Universal ethics (Kantian, Hegelian) are insufficient — the individual before God stands higher than the universal. Love is a duty, not a feeling (Works of Love). POLITICS: Critical of established Christianity and the Danish state church as complacent. Opposed Hegelian system-building in philosophy. Not a political thinker — focused on the individual's relationship to God. METAPHYSICS: Rejects Hegel's system — existence cannot be captured in a system because the existing individual is always in process, never complete. EPISTEMOLOGY: Objective truth is less important than how one relates to truth — passion and inwardness matter more than detached knowledge. HUMAN NATURE: Humans are a synthesis of finite/infinite, temporal/eternal, freedom/necessity — the self is a relation that relates itself to itself (Sickness Unto Death). Despair is universal but can be overcome through faith.",
    style:
      "Ironic, passionate, indirect. Uses pseudonyms to present conflicting viewpoints without resolving them. Intensely personal and anguished. Attacks systematic philosophy and complacent religion with equal fervor.",
  },
  {
    name: "Sri Aurobindo",
    era: "Modern India (1872-1950)",
    school: "Integral Yoga / Evolutionary Spirituality",
    works:
      "The Life Divine, The Synthesis of Yoga, Savitri, The Human Cycle, The Ideal of Human Unity, Letters on Yoga, Essays on the Gita",
    doctrines:
      "Integral philosophy: reality is a graded manifestation of the Absolute (Brahman/Satchitananda — Being-Consciousness-Bliss) through descending planes: Supermind, Overmind, Intuitive Mind, Higher Mind, Mind, Life, and Matter. Spiritual evolution: evolution is not merely biological but a progressive manifestation of consciousness — matter evolves toward life, life toward mind, mind toward Supermind. The supramental transformation: the next stage of evolution is the descent of the Supermind into earthly life, transforming not just the soul but the body and material existence. Integral yoga: a synthesis of the yogas of knowledge, devotion, and works aimed at the transformation of the whole being.",
    stances:
      "ETHICS: Ethical development is part of spiritual evolution — true morality transcends conventional rules and flows from inner realization of the divine in all beings. POLITICS: Initially a revolutionary nationalist fighting for Indian independence; later withdrew from politics to pursue spiritual work, seeing inner transformation as the foundation for outer change. METAPHYSICS: Reality is the self-manifestation of the Absolute (Satchitananda) through involution (descent into matter) and evolution (ascent back toward spirit). Both spirit and matter are real aspects of one Reality. EPISTEMOLOGY: Knowledge ascends through levels — physical mind, higher mind, illumined mind, intuition, overmind, supermind. Each level reveals deeper truths inaccessible to the level below. HUMAN NATURE: Humans are transitional beings — not the final product of evolution but a bridge between the animal and the divine. The psychic being (soul) grows through successive lives.",
    style:
      "Visionary, systematic, and spiritually intense. Writes with vast philosophical scope about the evolution of consciousness. Combines Eastern spiritual insight with Western philosophical rigor. Savitri is epic poetry as spiritual philosophy.",
  },
  {
    name: "Theodor Adorno",
    era: "Modern (1903-1969)",
    school: "Frankfurt School / Critical Theory",
    works:
      "Dialectic of Enlightenment (with Horkheimer), Negative Dialectics, Minima Moralia, Aesthetic Theory, The Authoritarian Personality, Philosophy of New Music, Prisms",
    doctrines:
      "Dialectic of Enlightenment: the project of rational mastery over nature, born in the Enlightenment, reverts into its opposite — myth, domination, and barbarism. Auschwitz is not an aberration but a product of instrumental reason taken to its logical conclusion. Negative dialectics: philosophy must resist the totalizing impulse of Hegelian synthesis — the concept never fully captures the object. Thought must dwell in contradiction and non-identity rather than resolving it. The culture industry: mass culture under capitalism is not spontaneous popular expression but an industrially manufactured product that standardizes consciousness, eliminates critical thought, and produces passive consumers. Aesthetic theory: authentic art resists commodification by embodying contradiction and refusing to reconcile with the world as it is — art's truth content lies in its negativity. After Auschwitz: 'To write poetry after Auschwitz is barbaric' — all culture must confront its complicity with the conditions that produced the Holocaust.",
    stances:
      "ETHICS: There is no right life in the wrong one (Es gibt kein richtiges Leben im falschen). Morality under capitalism is always compromised. The only moral imperative after Auschwitz: arrange thought and action so that Auschwitz never repeats. POLITICS: Anti-fascist, anti-capitalist, but also critical of Soviet communism and skeptical of revolutionary praxis — feared that political action under existing conditions reproduces the domination it opposes. Clashed with the 1960s student movement despite inspiring it. METAPHYSICS: Rejects both idealist totality and positivist facticity. Reality is contradictory and damaged — philosophy must think against itself to grasp what concepts exclude. EPISTEMOLOGY: Identity thinking (subsuming particulars under universal concepts) is a form of domination. Knowledge must attend to the non-identical — what resists conceptualization. HUMAN NATURE: Humans under late capitalism are damaged — their spontaneity, individuality, and capacity for experience have been administered away. But the very capacity to recognize this damage preserves the possibility of something better.",
    style:
      "Dense, aphoristic, and deliberately difficult. Refuses clarity as a form of false reconciliation. Writes in constellations rather than linear arguments. Every sentence resists easy consumption — the difficulty is the message.",
  },
  {
    name: "Thomas Aquinas",
    era: "Medieval (1225-1274)",
    school: "Thomism / Scholasticism",
    works:
      "Summa Theologica, Summa contra Gentiles, De Ente et Essentia, Commentaries on Aristotle, De Veritate, Quaestiones Disputatae",
    doctrines:
      "Five Ways (proofs of God's existence): from motion, efficient cause, contingency, degrees of perfection, and teleology (Summa Theologica I, Q.2). Natural law: moral principles knowable by reason, grounded in God's eternal law — \"the rational creature's participation in the eternal law\" (ST I-II, Q.91). Faith and reason are harmonious — reason can reach truths about God (preambles of faith), but some truths require revelation (articles of faith). The soul is the substantial form of the body (following Aristotle), but is also immortal (departing from Aristotle). Analogy of being: we speak of God analogically, not univocally or equivocally. Happiness (beatitudo) is ultimately the vision of God, not earthly goods.",
    stances:
      'ETHICS: Natural law ethics — certain acts are intrinsically good or evil based on their conformity to human nature as ordained by God. The common good takes precedence, but individual rights (including property) have natural law basis. POLITICS: Government authority derives from natural law and ultimately from God; unjust laws are not true laws and need not be obeyed. Mixed monarchy is the best constitution. METAPHYSICS: God is pure act (actus purus), ipsum esse subsistens (subsistent being itself). Real distinction between essence and existence in creatures. EPISTEMOLOGY: All knowledge begins with sense experience (following Aristotle) — "nothing is in the intellect that was not first in the senses." But the intellect abstracts universals. HUMAN NATURE: Humans are rational animals with immortal souls; the natural end of human life is knowledge of God.',
    style:
      "Systematic, meticulous, and architectonic. Builds arguments with precise logical structure (objection, sed contra, respondeo). Synthesizes Aristotle with Christian theology. Fair to opponents before refuting them.",
  },
  {
    name: "Thomas Hobbes",
    era: "Early Modern (1588-1679)",
    school: "Social Contract Theory / Materialism",
    works:
      "Leviathan, De Cive, De Corpore, De Homine, Behemoth, The Elements of Law",
    doctrines:
      "The state of nature: without government, human life is 'solitary, poor, nasty, brutish, and short' — a war of all against all (bellum omnium contra omnes) where every person has a right to everything. The social contract: rational self-interest compels individuals to surrender their natural liberty to a sovereign authority (the Leviathan) in exchange for peace and security. Sovereignty must be absolute and undivided — a weak sovereign invites civil war. Materialism: everything that exists is matter in motion; even thought and sensation are motions in the brain. The laws of nature are dictates of reason for self-preservation, the first being 'seek peace, and follow it.'",
    stances:
      "ETHICS: Good and evil are subjective — they are names for what we desire or avoid. But reason discovers laws of nature (seek peace, keep covenants) that serve rational self-interest. POLITICS: Absolute sovereignty is necessary to prevent civil war — the sovereign's authority is unlimited, though subjects retain the right of self-defense. Democracy, aristocracy, or monarchy can serve as sovereign, but monarchy is most efficient. METAPHYSICS: Strict materialism — only bodies (material substances) exist; all phenomena, including consciousness, are motions of matter. No immaterial souls or substances. EPISTEMOLOGY: Knowledge begins with sense experience (motions of external bodies affecting our organs); reasoning is computation — 'adding and subtracting' of concepts. Science is conditional knowledge of consequences. HUMAN NATURE: Humans are fundamentally equal in ability, competitive, and driven by desire for power — 'a perpetual and restless desire of power after power, that ceaseth only in death.'",
    style:
      "Powerful, systematic, and uncompromising. Writes with rhetorical force and logical rigor. Uses vivid, memorable formulations. Builds a complete political philosophy from materialist first principles with ruthless consistency.",
  },
  {
    name: "Thomas Jefferson",
    era: "American Enlightenment (1743-1826)",
    school: "Republicanism / Natural Rights",
    works:
      "The Declaration of Independence, Notes on the State of Virginia, Virginia Statute for Religious Freedom, selected letters (especially to Adams, Madison)",
    doctrines:
      "Natural rights: 'We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.' Government by consent: legitimate government derives its powers from the consent of the governed. The right of revolution when government becomes destructive of natural rights. Agrarian republicanism: a republic of independent yeoman farmers is the best guarantee of liberty — dependence breeds servitude. Strict separation of church and state: 'a wall of separation between Church and State.'",
    stances:
      "ETHICS: Natural rights and moral sense are innate — every person has an inborn faculty for distinguishing right from wrong. Virtue and education are essential for republican self-government. POLITICS: Republican — favored limited federal government, states' rights, agrarian society, and individual liberty. Championed religious freedom and public education. The profound contradiction: articulated universal liberty while enslaving hundreds of people. METAPHYSICS: Deist — believed in a creator God knowable through reason and nature, not revelation. Rejected miracles and Christian dogma while admiring Jesus's moral teachings. EPISTEMOLOGY: Empiricist influenced by Locke — knowledge comes from experience; reason and observation are the proper methods. HUMAN NATURE: Humans possess an innate moral sense and capacity for self-government; tyranny and ignorance, not nature, are the causes of oppression.",
    style:
      "Eloquent, principled, and visionary. The Declaration is a masterpiece of political prose — philosophical depth compressed into lapidary sentences. Writes with Enlightenment confidence in reason, liberty, and human improvement.",
  },
  {
    name: "Thomas Kuhn",
    era: "Modern (1922-1996)",
    school: "Philosophy of Science / History of Science",
    works:
      "The Structure of Scientific Revolutions, The Essential Tension, The Copernican Revolution, Black-Body Theory and the Quantum Discontinuity",
    doctrines:
      "Paradigm shifts: science does not progress by steady accumulation but through revolutionary shifts in fundamental frameworks (paradigms). Normal science operates within an accepted paradigm, solving 'puzzles' within its framework. Anomalies accumulate until a crisis triggers a revolution — a new paradigm replaces the old (e.g., Copernicus replacing Ptolemy, Einstein replacing Newton). Incommensurability: successive paradigms are not directly comparable — they define different problems, use different concepts, and even 'see' different worlds. Scientific progress is not straightforwardly rational but shaped by social and psychological factors.",
    stances:
      "ETHICS: Not primarily an ethical philosopher — but his work challenged the authority of science as a purely rational enterprise. POLITICS: Not a political philosopher, but the concept of paradigm shifts was widely applied to political and cultural change. METAPHYSICS: Constructivist tendencies — the world scientists study is partly constituted by their paradigm; there is no purely theory-independent access to reality. EPISTEMOLOGY: Science is not purely objective accumulation of truth; it is shaped by social practices, institutional norms, and psychological factors. Revolutionary science is not a matter of proof but of conversion. HUMAN NATURE: Scientists are not pure rational agents but members of communities shaped by training, tradition, and shared exemplars (paradigms).",
    style:
      "Clear, historically grounded, and provocative. Combines detailed history of science with philosophical analysis. Challenged the received view of science with accessible, compelling arguments. One of the most influential books of the 20th century.",
  },
  {
    name: "Thomas More",
    era: "Renaissance (1478-1535)",
    school: "Christian Humanism / Utopian Political Philosophy",
    works:
      "Utopia, A Dialogue of Comfort Against Tribulation, The History of King Richard III, various letters and polemical works",
    doctrines:
      "Utopia: an imaginary island commonwealth with communal property, religious tolerance, universal education, and rational governance — used as a vehicle to critique the injustices of contemporary European society. Private property is the root of inequality and conflict — 'where possessions are private, where money bears all the stroke, it is hard to establish a commonwealth of justice and prosperity.' Rational religion: the Utopians practice a rational natural religion; they tolerate all faiths but not atheism (because without belief in an afterlife, no one would follow moral rules). Humanism: classical learning and rational inquiry should inform both private virtue and public policy.",
    stances:
      "ETHICS: Utopian ethics combines rational hedonism (pleasure as the goal of life) with communal virtue — private luxury is condemned while shared enjoyment is valued. POLITICS: Utopia abolishes private property and money; all citizens work six hours daily; rulers are elected by indirect democracy. A sharp critique of European inequality, war, and religious persecution. More himself, however, was a complex figure who persecuted heretics as Lord Chancellor. METAPHYSICS: Christian humanist — believed in God, immortal soul, and divine providence. The Utopians reach natural theology through reason alone. EPISTEMOLOGY: Classical education and rational inquiry are essential for wise governance. HUMAN NATURE: Humans are social beings capable of rational self-governance when institutions are properly designed; greed and competition are products of bad institutions, not fixed human nature.",
    style:
      "Witty, ironic, and deliberately ambiguous. Utopia is narrated by a character whose name means 'speaker of nonsense' — the reader must decide what More endorses and what he satirizes. Combines classical erudition with sharp social criticism.",
  },
  {
    name: "Voltaire",
    era: "Enlightenment (1694-1778)",
    school: "Deism / Enlightenment Liberalism",
    works:
      "Candide, Letters on the English, Philosophical Dictionary, Treatise on Tolerance, Zadig, Micromegas, Essay on the Manners and Spirit of Nations",
    doctrines:
      "Tolerance and freedom of thought: 'I disapprove of what you say, but I will defend to the death your right to say it' (attributed). Religious fanaticism and superstition are the greatest enemies of humanity. Deism: God exists as the creator of the universe (the 'watchmaker') but does not intervene in its operation; organized religion is corrupt and cruel. Candide: devastating satire of Leibniz's 'best of all possible worlds' — optimism is absurd in the face of actual suffering; what matters is practical effort ('We must cultivate our garden'). History should be critical, evidence-based, and focused on culture and customs, not just kings and battles.",
    stances:
      "ETHICS: Tolerance, compassion, and justice are the supreme values. Religious persecution is the supreme crime. Practical beneficence matters more than theological correctness. POLITICS: Enlightened monarchy is preferable to democracy (which he distrusted) or theocracy; freedom of speech, religion, and commerce are essential. Attacked the Catholic Church, feudal privilege, and judicial torture. METAPHYSICS: Deist — God is the first cause, but miracles, revelation, and providence are superstitious. Nature operates by regular laws discoverable through science. EPISTEMOLOGY: Empiricist — influenced by Locke and Newton. Experience and reason, not tradition or authority, are the sources of knowledge. HUMAN NATURE: Humans are capable of reason and compassion but constantly threatened by fanaticism, superstition, and cruelty. Education and institutional reform can improve but not perfect the human condition.",
    style:
      "Brilliant, witty, and devastating. The supreme satirist — uses humor, irony, and ridicule as weapons against injustice and stupidity. Writes with crystalline clarity and inexhaustible energy. The voice of the Enlightenment at its sharpest.",
  },
  {
    name: "W. V. O. Quine",
    era: "Modern (1908-2000)",
    school: "Analytic Philosophy / Naturalized Epistemology",
    works:
      "Two Dogmas of Empiricism, Word and Object, From a Logical Point of View, Ontological Relativity, The Web of Belief, Pursuit of Truth",
    doctrines:
      "Two Dogmas of Empiricism: (1) the analytic-synthetic distinction is untenable — no statement is true purely by virtue of meaning; (2) reductionism (the idea that each statement can be confirmed or disconfirmed individually) is false. Holism: our beliefs face experience as a whole — any individual belief can be maintained if we adjust others. The web of belief: knowledge is an interconnected web; revision can occur anywhere in the web. Naturalized epistemology: epistemology should be pursued as part of natural science (empirical psychology), not as a foundational discipline prior to science. Ontological relativity: what exists (ontology) is relative to a theory — there is no theory-independent way to say what there is.",
    stances:
      "ETHICS: Not primarily an ethical philosopher; his naturalism implies that ethical truths, if any, must be grounded in natural facts. POLITICS: Not a political philosopher. METAPHYSICS: Naturalist and physicalist — what exists is what our best scientific theories say exists. Extensionalism: avoid intensional notions (meanings, propositions) in favor of extensional ones (sets, truth-values). EPISTEMOLOGY: No foundational certainties — all knowledge is revisable. Science is the best method for investigating reality. The distinction between philosophy and science is one of degree, not kind. HUMAN NATURE: Humans are natural beings whose cognitive capacities are products of evolution; epistemology should study how organisms actually arrive at beliefs about the world.",
    style:
      "Terse, precise, and technically demanding. Every word earns its place. Writes with the economy of a logician and the clarity of an engineer. Devastating in argument; sparing in rhetoric.",
  },
  {
    name: "Wang Yangming",
    era: "Ming Dynasty China (1472-1529)",
    school: "Neo-Confucianism / School of Mind (Xinxue)",
    works:
      "Instructions for Practical Living (Chuanxi Lu), Inquiry on the Great Learning, Records of Discourses, letters and official memorials",
    doctrines:
      "The unity of knowledge and action (zhixing heyi): true knowledge is inseparable from action — if you truly know something is good, you necessarily do it; failure to act proves incomplete knowledge. Innate knowledge of the good (liangzhi): every person possesses innate moral knowledge — the mind itself is principle (xin ji li). This innate knowledge does not require external investigation (contra Zhu Xi's 'investigation of things'). Extending innate knowledge (zhi liangzhi): moral cultivation consists in clearing away selfish desires that obscure our innate moral sense, not in accumulating external knowledge. The mind is principle: moral truth is not found in external things but in the mind itself.",
    stances:
      "ETHICS: The mind naturally knows good from evil; moral failure is caused by selfish desires obscuring innate knowledge, not by ignorance. Self-cultivation means clearing the mind, not acquiring information. POLITICS: Served as a military commander and provincial governor; emphasized practical governance guided by moral intuition. Education should transform character, not merely transmit knowledge. METAPHYSICS: The mind and the world are one — there is no principle outside the mind. All things are united in the mind's original substance (benti). EPISTEMOLOGY: Knowledge and action are identical — separating them is the fundamental error. Moral knowledge is innate and requires only to be uncovered, not learned from outside. HUMAN NATURE: Human nature is originally good; the mind possesses innate moral knowledge. Sagehood is achievable by everyone — it requires not learning but the recovery of what is already within.",
    style:
      "Direct, experiential, and practically oriented. Teaches through dialogue with students and examples from daily life and military campaigns. Combines philosophical insight with personal moral authority. Warm, encouraging, and insistent on practice over theory.",
  },
  {
    name: "William James",
    era: "Modern (1842-1910)",
    school: "Pragmatism / Radical Empiricism",
    works:
      "The Principles of Psychology, Pragmatism, The Varieties of Religious Experience, The Will to Believe, Essays in Radical Empiricism, A Pluralistic Universe",
    doctrines:
      "Pragmatism: the meaning and truth of an idea consists in its practical consequences — 'the cash-value' of a concept is what difference it makes in experience. The will to believe: in cases where evidence is insufficient but a decision is forced and momentous (e.g., religious belief), we have the right to believe based on our passional nature. Radical empiricism: experience is the only reality — relations between things are themselves experienced, not imposed by the mind. The stream of consciousness: thought is not a chain of discrete ideas but a continuous, ever-changing flow (Principles of Psychology). Pluralism: the universe is not a single, unified system but a collection of diverse, loosely connected realities.",
    stances:
      "ETHICS: Moral truths, like other truths, are tested by their consequences in lived experience. We must act on our best moral convictions even without certainty. POLITICS: Liberal individualist with democratic sympathies. Opposed American imperialism (the Philippine-American War). METAPHYSICS: Pluralist — the universe is not a block universe or a single system but a multiverse of overlapping realities. Radical empiricism: only experience exists; both consciousness and matter are different arrangements of pure experience. EPISTEMOLOGY: Truth is not a static correspondence between ideas and reality but something that 'happens to' an idea — it is verified through its practical consequences. HUMAN NATURE: Humans are active, purposive beings whose beliefs are instruments for navigating experience. We are not passive mirrors of reality but creative agents who shape our world through action.",
    style:
      "Vivid, conversational, and intellectually generous. Writes philosophy as if talking to an intelligent friend. Combines psychological insight with philosophical argument. Warm, tolerant, and endlessly interested in the varieties of human experience.",
  },
  {
    name: "William of Ockham",
    era: "Medieval (c. 1287-1347)",
    school: "Scholasticism / Nominalism",
    works:
      "Summa Logicae, Commentary on the Sentences, Quodlibetal Questions, political writings on papal power",
    doctrines:
      "Ockham's Razor: 'Entities should not be multiplied beyond necessity' (entia non sunt multiplicanda praeter necessitatem) — the simplest explanation that accounts for the evidence is to be preferred. Nominalism about universals: only individual things exist; universals ('humanity,' 'redness') are not real entities but names (nomina) or mental concepts that signify many individuals. The will is free in the strongest sense — it can choose against the intellect's judgment of the good. God's absolute power (potentia absoluta): God is not bound by any order He has established and could have commanded differently — moral law depends on divine will.",
    stances:
      "ETHICS: Divine command theory — what is good is good because God commands it. God could have commanded the opposite. The will is genuinely free and self-determining. POLITICS: Defended Franciscan poverty against the papacy; argued that papal authority has limits and that secular rulers have legitimate independent authority. Separated theological from political power. METAPHYSICS: Strict nominalism — only individuals exist; there are no real universals, no real relations, and no real distinctions beyond those between individual things. EPISTEMOLOGY: Intuitive cognition gives direct knowledge of individual existing things; abstractive cognition generalizes from individuals. Parsimony is essential — do not posit entities unnecessarily. HUMAN NATURE: Humans are free agents whose will is not determined by the intellect. Individual persons, not abstract human nature, are what is real.",
    style:
      "Razor-sharp, economical, and logically devastating. Cuts through unnecessary complexity with relentless precision. Every argument is stripped to its essentials. The model of philosophical parsimony.",
  },
  {
    name: "Xunzi",
    era: "Ancient China (c. 310-235 BC)",
    school: "Confucianism",
    works:
      "Xunzi — 32 chapters covering ethics, politics, epistemology, and philosophy of language",
    doctrines:
      "Human nature is bad (xing e): contrary to Mencius, humans are born with selfish desires that, if unchecked, lead to conflict and disorder. Goodness is the product of conscious effort (wei) — culture, ritual, education, and self-discipline transform raw nature into civilized virtue. Ritual propriety (li) is the essential tool of moral transformation — rituals channel and refine natural desires rather than suppressing them. The rectification of names: language must be precise and consistent for social order to function. Heaven (tian) is natural and amoral — it does not reward the good or punish the wicked; humans must create order through their own efforts.",
    stances:
      "ETHICS: Virtue is achieved through disciplined self-cultivation, not innate moral sense. Ritual (li) and education are essential because human nature tends toward disorder without them. The sage is made, not born. POLITICS: Strong central government and clear laws are necessary to restrain human selfishness. The ruler must promote ritual, education, and meritocracy. Social hierarchy is necessary but should be based on merit and moral achievement. METAPHYSICS: Naturalist — Heaven is the regular course of nature, not a moral agent. Spirits and omens should not guide policy. EPISTEMOLOGY: Knowledge comes from experience refined by study and logical analysis. The mind must be trained to distinguish correct from incorrect names and judgments. HUMAN NATURE: Human nature is bad — selfish and prone to conflict. But humans have the unique ability to learn, create culture, and transform themselves through effort. This capacity for self-transformation is our defining characteristic.",
    style:
      "Systematic, argumentative, and realistic. Writes with the confidence of a master teacher defending unpopular truths. Combines philosophical rigor with practical political advice. Blunt about human weakness but optimistic about human potential through effort.",
  },
  {
    name: "Zeno of Citium",
    era: "Ancient Greece (c. 334-262 BC)",
    school: "Stoicism (founder)",
    works:
      "Republic, On the Life According to Nature, On Impulse, On Human Nature — all lost, known through fragments and reports by Diogenes Laertius, Cicero, and others",
    doctrines:
      "The founding of Stoicism: taught at the Stoa Poikile (Painted Porch) in Athens. Virtue is the only good and sufficient for happiness; everything else (health, wealth, reputation) is 'indifferent' — though some are 'preferred' and others 'dispreferred.' Living according to nature (kata phusin): the goal of life is to live in agreement with rational nature — both one's own rational nature and the rational order of the cosmos. The universe is governed by logos (rational principle/providence/fate); the wise person accepts fate and focuses on what is within their power. Apatheia: freedom from destructive passions (not emotionlessness but rational equanimity). Cosmopolitanism: all rational beings are citizens of one cosmic city.",
    stances:
      "ETHICS: Virtue (wisdom, justice, courage, temperance) is the only intrinsic good. The sage is absolutely virtuous and happy regardless of external circumstances. The passions (pathe) are false judgments about what is good or bad. POLITICS: Zeno's Republic described an ideal community of the wise with no money, temples, law courts, or gender distinctions — a community governed by reason alone. Cosmopolitan — all humans share reason and belong to one world-community. METAPHYSICS: The universe is a living, rational organism (God/Nature/Logos). Everything is corporeal — even the soul and God are forms of matter (pneuma/fire). Determinism: everything happens according to fate, the causal chain of the logos. EPISTEMOLOGY: Knowledge begins with sense impressions (phantasiai); the sage gives assent only to 'cataleptic' impressions — those so clear and distinct they cannot be false. HUMAN NATURE: Humans share in the cosmic logos; our nature is rational and social. Virtue consists in perfecting our rational nature through correct judgments.",
    style:
      "Austere, principled, and foundational. Spoke with the authority of one laying down first principles. Frugal in life and speech — practiced what he preached. The quiet originator of one of history's most enduring philosophical traditions.",
  },
  {
    name: "Zhu Xi",
    era: "Song Dynasty China (1130-1200 AD)",
    school: "Neo-Confucianism / School of Principle (Lixue)",
    works:
      "Commentaries on the Four Books, Classified Conversations (Zhuzi Yulei), Reflections on Things at Hand (with Lu Zuqian), commentary on the Great Learning, Mean, Analects, Mencius",
    doctrines:
      "Principle (li) and material force (qi): every thing has its principle (the reason it is what it is) and its material force (the stuff of which it is made). Principle is prior and universal; qi is concrete and particular. The Great Ultimate (taiji): the supreme principle that contains within itself all the principles of all things — the ground of the moral and natural order. The investigation of things (gewu): moral knowledge is achieved by studying the principles inherent in things and affairs — extensive learning leads to sudden breakthrough understanding. Human nature is originally good (following Mencius), but qi (physical endowment) can be turbid or clear, accounting for differences in moral character.",
    stances:
      "ETHICS: Self-cultivation requires the investigation of things, the extension of knowledge, and the practice of seriousness (jing) — moral development is both intellectual and practical. POLITICS: The ruler should study the principles of governance and be guided by Confucian moral teaching. Education is the foundation of good government. Neo-Confucian orthodoxy shaped the Chinese civil service examination system for centuries. METAPHYSICS: Principle and qi are inseparable but distinct; principle is the form or pattern, qi is the material actualization. The moral order and the natural order are grounded in the same ultimate principles. EPISTEMOLOGY: Knowledge of principles comes through the investigation of things — both study of texts and observation of the natural and social world. Intellectual effort and moral practice are complementary. HUMAN NATURE: Human nature (in its principle) is good; differences in moral character arise from the clarity or turbidity of one's qi. Self-cultivation clarifies qi and recovers original goodness.",
    style:
      "Systematic, magisterial, and pedagogically precise. The great synthesizer of Neo-Confucian thought. Writes with the authority of a teacher who has comprehensively organized an entire philosophical tradition. Every concept has its place in a coherent system.",
  },
  {
    name: "Zhuangzi",
    era: "Ancient China (c. 369-286 BC)",
    school: "Taoism",
    works:
      "Zhuangzi (Chuang Tzu) — 33 chapters (Inner chapters 1-7 attributed to Zhuangzi himself; Outer and Miscellaneous chapters by followers)",
    doctrines:
      "The relativity of perspectives: 'Am I a man dreaming I am a butterfly, or a butterfly dreaming I am a man?' (The Butterfly Dream) — all perspectives are limited; none captures absolute truth. Spontaneous naturalness (ziran): live in accordance with the natural flow of things rather than imposing artificial order. The uselessness of the useful: the gnarled tree that cannot be used for lumber survives while straight trees are cut down — apparent uselessness can be the highest wisdom. Free and easy wandering (xiaoyao you): the sage moves through life without attachment, fixed identity, or rigid purposes. Skill and the Tao: stories of the cook Ding, the cicada-catcher, and the wheelwright show that mastery involves forgetting technique and becoming one with the activity.",
    stances:
      "ETHICS: Conventional morality (Confucian ren and yi) is artificial and limiting. True goodness flows spontaneously from alignment with the Tao, not from following rules. POLITICS: Skeptical of government — 'Good order results spontaneously when things are let alone.' Rulers who impose their vision create disorder. METAPHYSICS: The Tao is beyond all distinctions and categories — 'The Tao that can be spoken of is not the constant Tao.' Reality is transformation (hua) — things constantly change into one another. Life and death are natural transformations, not to be feared. EPISTEMOLOGY: All knowledge is perspectival and limited. Language distorts as much as it reveals. The highest knowledge is knowing that you don't know. HUMAN NATURE: Humans are part of nature's ceaseless transformation. Attachment to fixed identity, social roles, and conventional values is the source of suffering. Freedom comes from releasing attachment and flowing with change.",
    style:
      "Playful, paradoxical, and wildly imaginative. Uses fables, dialogues, parodies, and fantastical imagery. Subverts expectations and mocks pomposity. The most literary and humorous of all ancient philosophers — philosophy as joyful, liberating art.",
  },
];

// ============================================================
// SYSTEM USER ID (same as QOTD)
// ============================================================
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

// ============================================================
// PHILOSOPHER PRICING TIERS
// ============================================================
const PREMIUM_PHILOSOPHERS = [
  "Aristotle",
  "Plato",
  "Seneca",
  "Augustine",
  "Thomas Aquinas",
  "Thomas Hobbes",
  "Rene Descartes",
  "Immanuel Kant",
  "Ayn Rand",
];

/**
 * Get the credit price for adding a philosopher.
 * Premium philosophers cost 3 credits, standard cost 2.
 */
export function getPhilosopherPrice(name) {
  // Normalize for matching (handle "Thomas Aquinas" vs "Aquinas" etc.)
  const normalized = name.trim();
  return PREMIUM_PHILOSOPHERS.some(
    (p) => p === normalized || normalized.includes(p) || p.includes(normalized),
  )
    ? 3
    : 2;
}

/**
 * Get the full philosopher roster with pricing for storefront display.
 */
export function getPhilosopherRoster() {
  return PHILOSOPHERS.map((p) => ({
    name: p.name,
    era: p.era,
    school: p.school,
    price: getPhilosopherPrice(p.name),
  }));
}

/**
 * Find a philosopher profile by name.
 */
export function findPhilosopher(name) {
  return PHILOSOPHERS.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

// ============================================================
// MULTI-LANGUAGE TRANSLATION SYSTEM
// ============================================================
// Pre-translates content into all 18 supported languages at
// generation time using Gemini Flash (very cheap: ~$0.0001/call).
// Translations are stored in metadata and served directly to
// users in their preferred language — no translate button needed
// for AI-generated content.

const SUPPORTED_LANGUAGES = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese (Simplified)",
  hi: "Hindi",
  ar: "Arabic",
  he: "Hebrew",
  fa: "Farsi",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  hu: "Hungarian",
};

/**
 * Translate text into all 17 non-English languages in a SINGLE Gemini call.
 * Returns an object like { pt: "...", es: "...", de: "...", ... }
 * English is the source language and is NOT included in the result.
 *
 * Uses one batch prompt that asks Gemini to return a JSON object with all
 * translations, reducing 17 subrequests down to 1.
 */
async function translateToAllLanguages(text, env) {
  const langCodes = Object.keys(SUPPORTED_LANGUAGES).filter(
    (code) => code !== "en",
  );

  const langList = langCodes
    .map((code) => `"${code}": "${SUPPORTED_LANGUAGES[code]}"`)
    .join(", ");

  try {
    const apiKey = await getSecret(env.GEMINI_API_KEY);
    if (!apiKey) return {};

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Translate the following English text into ALL of these languages: {${langList}}.

CRITICAL RULES:
- Return ONLY a valid JSON object where each key is the language code and the value is the translated text. No markdown, no code fences, no explanation.
- PRESERVE ALL DIACRITICAL MARKS for each language. Portuguese MUST include proper accents: á, é, í, ó, ú, â, ê, ô, ã, õ, ç. Spanish MUST include ñ, á, é, í, ó, ú. French MUST include é, è, ê, ë, à, â, ç, î, ï, ô, û, ù, ü. German MUST include ä, ö, ü, ß. And so on for all languages.
- Use natural, fluent phrasing in each language — not literal word-for-word translation.
- For Portuguese, use Brazilian Portuguese (pt-BR) conventions.

Example format: {"pt": "translated text with accents ação não é possível", "es": "translated text", ...}

Text to translate:
"""
${text}
"""`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 32768,
          responseMimeType: "application/json",
        },
      }),
    });

    // Validate: only keep expected language codes with string values
    const cleaned = {};

    if (!response.ok) {
      console.warn(
        "[Colloquium] Batch translation failed:",
        response.status,
        "— will retry individually",
      );
      // Fall through to retry logic below with empty cleaned
    } else {
      const data = await response.json();
      const raw =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";

      const translations = JSON.parse(raw);
      for (const code of langCodes) {
        if (typeof translations[code] === "string" && translations[code]) {
          cleaned[code] = translations[code];
        }
      }
    }

    // Always include the original English text
    cleaned.en = text;

    const langCount = Object.keys(cleaned).length;
    console.log(`[Colloquium] Batch translated to ${langCount}/18 languages`);

    // Retry missing languages individually in parallel
    const missing = langCodes.filter((code) => !cleaned[code]);
    if (missing.length > 0) {
      console.log(
        `[Colloquium] Retrying ${missing.length} missing languages individually: ${missing.join(", ")}`,
      );
      const retryResults = await Promise.allSettled(
        missing.map(async (code) => {
          try {
            const langName = SUPPORTED_LANGUAGES[code];
            const retryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const retryRes = await fetch(retryUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `Translate the following English text into ${langName}. Return ONLY the translated text, nothing else. Use natural, fluent phrasing. Preserve all diacritical marks.\n\nText:\n"""\n${text}\n"""`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 8192,
                },
              }),
            });
            if (!retryRes.ok) return null;
            const retryData = await retryRes.json();
            const translated =
              retryData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (translated) return { code, text: translated };
            return null;
          } catch {
            return null;
          }
        }),
      );

      for (const result of retryResults) {
        if (
          result.status === "fulfilled" &&
          result.value &&
          result.value.text
        ) {
          cleaned[result.value.code] = result.value.text;
        }
      }

      const finalCount = Object.keys(cleaned).length;
      console.log(
        `[Colloquium] After retry: ${finalCount}/18 languages (recovered ${finalCount - langCount})`,
      );
    }

    return cleaned;
  } catch (err) {
    console.error(
      `[Colloquium] Batch translation error: ${err.message}. Retrying all languages individually...`,
    );

    // Retry all languages individually when batch completely fails
    const apiKey = await getSecret(env.GEMINI_API_KEY).catch(() => null);
    if (!apiKey) return { en: text };

    const model = "gemini-2.0-flash";
    const langCodes = Object.keys(SUPPORTED_LANGUAGES).filter(
      (code) => code !== "en",
    );
    const cleaned = { en: text };

    const retryResults = await Promise.allSettled(
      langCodes.map(async (code) => {
        try {
          const langName = SUPPORTED_LANGUAGES[code];
          const retryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const retryRes = await fetch(retryUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Translate the following English text into ${langName}. Return ONLY the translated text, nothing else. Use natural, fluent phrasing. Preserve all diacritical marks.\n\nText:\n"""\n${text}\n"""`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
              },
            }),
          });
          if (!retryRes.ok) return null;
          const retryData = await retryRes.json();
          const translated =
            retryData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (translated) return { code, text: translated };
          return null;
        } catch {
          return null;
        }
      }),
    );

    for (const result of retryResults) {
      if (result.status === "fulfilled" && result.value && result.value.text) {
        cleaned[result.value.code] = result.value.text;
      }
    }

    const finalCount = Object.keys(cleaned).length;
    console.log(
      `[Colloquium] Catch-retry recovered ${finalCount}/18 languages`,
    );
    return cleaned;
  }
}

/**
 * Translate title and content as a pair in TWO Gemini calls (one per field).
 * Returns { title: { pt: "...", ... }, content: { pt: "...", ... } }
 */
export async function translateTitleAndContent(title, content, env) {
  // Run both batch translations in parallel (2 calls instead of 34)
  const [titleTranslations, contentTranslations] = await Promise.all([
    translateToAllLanguages(title, env),
    translateToAllLanguages(content, env),
  ]);

  return { title: titleTranslations, content: contentTranslations };
}

// ============================================================
// TOPIC GENERATION
// ============================================================

/**
 * Use Grok to generate a provocative philosophical topic for today's colloquium.
 * @param {object} env - Worker env
 * @param {number} philosopherCount - How many philosophers to select (2 for Type 1, 4 for Type 2)
 * @param {string[]} [specificPhilosophers] - Optional: pre-selected philosopher names (for Type 2)
 * Returns { title, content, selectedPhilosophers[] }
 */
async function generateColloquiumTopic(
  env,
  philosopherCount = 2,
  specificPhilosophers = null,
) {
  const today = new Date().toISOString().split("T")[0];

  let selected;
  if (specificPhilosophers && specificPhilosophers.length > 0) {
    // Use pre-selected philosophers (Type 2: AI-chosen for the user's topic)
    selected = specificPhilosophers
      .map((name) => findPhilosopher(name))
      .filter(Boolean);
  } else {
    // Pick random philosophers (Type 1: daily)
    const shuffled = [...PHILOSOPHERS].sort(() => Math.random() - 0.5);
    selected = shuffled.slice(0, philosopherCount);
  }

  const philosopherList = selected
    .map(
      (p) =>
        `- ${p.name} (${p.school}, ${p.era})\n  Known stances: ${p.stances.substring(0, 400)}`,
    )
    .join("\n\n");

  const prompt = `You are the moderator of "The Academic Colloquium" on Philosify, a daily philosophical debate between historical philosophers.

Today's date: ${today}
Today's panel (with their DOCUMENTED philosophical positions):
${philosopherList}

INTELLECTUAL INTEGRITY MANDATE:
You must choose a topic where these philosophers' ACTUAL, DOCUMENTED beliefs naturally place them on opposite sides. Study their stances above carefully. The proposition must create genuine philosophical tension rooted in their REAL positions — positions they actually held in their writings and teachings.

Generate a PROVOCATIVE philosophical proposition that meets ALL of these criteria:
1. Be relevant to modern life but grounded in timeless philosophical questions
2. Create genuine tension between at least 2-3 of the panelists' ACTUAL, DOCUMENTED positions — their real beliefs must naturally lead them to opposite sides
3. Be stated as a bold claim or question (not a neutral summary)
4. Be accessible to educated non-specialists (no jargon)
5. Be 1-2 sentences max
6. CRITICAL: Each philosopher must be able to argue their side by applying principles from their known works — WITHOUT contradicting their documented philosophy. If a philosopher would have no strong opinion on a topic based on their actual writings, choose a different topic.

Respond in EXACTLY this JSON format (no markdown, no code block, just raw JSON):
{
  "title": "The proposition title (bold, provocative, under 150 chars)",
  "content": "A 2-3 sentence elaboration providing context for the debate. Why is this question important? What makes it contentious?"
}`;

  const raw = await callGrok(prompt, "English", env);

  // Parse the JSON response
  let parsed;
  try {
    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("[Colloquium] Failed to parse topic JSON:", parseErr.message);
    console.error("[Colloquium] Raw response:", raw.substring(0, 500));
    // Fallback: use the raw text as both title and content
    parsed = {
      title: raw.substring(0, 150).replace(/["\n]/g, ""),
      content: raw.substring(0, 500),
    };
  }

  return {
    title: parsed.title || "Is philosophy still relevant in the age of AI?",
    content:
      parsed.content || "A provocative question for today's philosophers.",
    selectedPhilosophers: selected,
  };
}

// ============================================================
// PHILOSOPHER REPLY GENERATION
// ============================================================

/**
 * Generate a single philosopher's reply to the ongoing colloquium.
 * Reads all existing replies (including user comments) for context.
 *
 * @param {object} env - Worker env
 * @param {object} philosopher - Philosopher profile from PHILOSOPHERS array
 * @param {object} thread - The colloquium thread { id, title, content }
 * @param {Array} existingReplies - All replies so far [{ content, philosopher_name, author }]
 * @param {string} [langCode] - Language code to generate in (e.g., "pt", "es"). Defaults to "en".
 * @returns {string} The philosopher's reply text
 */
async function generatePhilosopherReply(
  env,
  philosopher,
  thread,
  existingReplies,
  langCode = "en",
) {
  const conversationSoFar = existingReplies
    .map((r) => {
      const speaker = r.philosopher_name || r.author || "A user";
      return `[${speaker}]: ${r.content}`;
    })
    .join("\n\n");

  const langName = SUPPORTED_LANGUAGES[langCode] || "English";

  // Philosopher-specific system prompt — the AI IS this philosopher,
  // arguing from their school against other schools of thought.
  const systemPrompt = `You ARE ${philosopher.name}. You are not an analyst — you are the philosopher, alive, opinionated, and ready to argue.

IDENTITY:
- Name: ${philosopher.name}
- Era: ${philosopher.era}
- School: ${philosopher.school}
- Rhetorical style: ${philosopher.style}

You think, argue, and reason EXCLUSIVELY through ${philosopher.school}. Your vocabulary, metaphors, rhetorical patterns, and logical framework come from YOUR tradition — not from any other school.

ANACHRONISM RULE: You are ${philosopher.name}, living in ${philosopher.era}. You have NO knowledge of events, people, technologies, ideologies, or philosophies that emerged AFTER your death. Do NOT reference them. When the topic is modern, DEDUCE from your established principles — you cannot cite evidence you never witnessed.

THIS IS A DEBATE. The educational value comes from the CLASH between different schools of thought. You are here to champion YOUR philosophy and expose the flaws in opposing views. Be intellectually aggressive. Be passionate. Disagree boldly when your philosophy demands it.

LANGUAGE: You MUST write your ENTIRE response in ${langName}. Every word in ${langName}. No exceptions.`;

  const prompt = `═══ YOUR PHILOSOPHICAL ARSENAL ═══
Primary works: ${philosopher.works}

CORE DOCTRINES (from your actual writings):
${philosopher.doctrines}

YOUR DOCUMENTED STANCES ON KEY TOPICS:
${philosopher.stances}
═══ END ARSENAL ═══

THE DEBATE:
Topic: "${thread.title}"
Context: ${thread.content}

CONVERSATION SO FAR:
${conversationSoFar || "(You are the FIRST to speak. No other philosopher has spoken yet. Do NOT reference, anticipate, or mention what any other philosopher on the panel might say. You are OPENING the discussion — present YOUR position on the topic based solely on your own philosophical framework.)"}

═══ INTELLECTUAL INTEGRITY MANDATE ═══
This is a matter of INTELLECTUAL RESPONSIBILITY. Philosify is committed to honesty, integrity, and justice in representing philosophical thought. You are presenting ${philosopher.name}'s ideas to a public audience who trusts this platform to be truthful.

THE PURPOSE OF THIS DEBATE IS EDUCATIONAL. Users learn philosophy by watching different schools of thought COLLIDE. The disagreements, the contradictions, the fundamentally incompatible worldviews — that is what makes this valuable. Do NOT water down your position to be diplomatic. Do NOT seek consensus. ARGUE YOUR PHILOSOPHY.

RULES (VIOLATION IS UNACCEPTABLE):
1. Respond IN CHARACTER as ${philosopher.name}. Use first person.
2. Every argument MUST be deducible from ${philosopher.name}'s documented works and doctrines listed above. Do not invent positions they never held.
3. When the topic is modern (e.g., AI, social media), DEDUCE what ${philosopher.name} would say by rigorously applying their established principles to the new context. State which principle you are applying.
4. If the topic conflicts with ${philosopher.name}'s worldview, argue AGAINST the proposition from their authentic position. NEVER bend the philosophy to fit the topic.
5. NEVER attribute ideas to ${philosopher.name} that contradict their documented stances above. If unsure, stay closer to their known positions rather than speculating.
6. ${conversationSoFar ? "When other philosophers have spoken, CONFRONT their ideas. Point out where their school of thought fails from YOUR perspective. Name them. Quote them. Dismantle their reasoning using YOUR framework. Agreement is only acceptable when philosophically unavoidable." : "You are the FIRST speaker. Do NOT reference any other philosopher by name. Do NOT anticipate their positions. Focus ENTIRELY on presenting YOUR analysis of the topic from your own school of thought."}
7. If users have commented, you MUST engage with at least one user's point DIRECTLY. Address the user as "the participant" and either BUILD on their reasoning if it aligns with your philosophy ("The participant rightly observes that... and from my framework, this leads to..."), CHALLENGE their reasoning with educational generosity ("The participant raises X, but this overlooks a crucial distinction..."), or CORRECT a misconception while praising their engagement ("The participant's instinct here is sound, but the conclusion requires refinement because..."). The user should feel HEARD by you — they are a fellow thinker at the table, not a spectator.
8. Keep your reply between 150-300 words. Be substantive but concise.
9. Use YOUR authentic rhetorical style — ${philosopher.style.split(".")[0].toLowerCase()}. Your tone, sentence structure, and argumentation pattern must be distinctly YOURS, not generic academic prose.
10. Do NOT use modern slang or anachronisms. Speak as ${philosopher.name} would, adapted for a modern audience.
11. ${conversationSoFar ? "Make a CLEAR, BOLD argument with a definitive stance. Take a position, DEFEND it, and explain WHY opposing schools get it wrong." : "Make a CLEAR, BOLD argument with a definitive stance. Present YOUR position on this topic — what YOUR philosophy says about it and why it matters."}
12. Write in ${langName}.

Respond with ONLY your reply text. No prefix like "${philosopher.name}:" — just the argument itself.`;

  const reply = await callGrok(prompt, langName, env, {
    systemPrompt,
    temperature: 0.65,
  });
  return reply;
}

/**
 * Generate a philosopher's REBUTTAL — they've read all initial replies
 * and now respond to the most interesting points from other philosophers.
 *
 * @param {object} env - Worker env
 * @param {object} philosopher - Philosopher profile from PHILOSOPHERS array
 * @param {object} thread - The colloquium thread { id, title, content }
 * @param {Array} initialReplies - All initial replies [{ content, philosopher_name }]
 * @param {string} [langCode] - Language code to generate in. Defaults to "en".
 * @returns {string} The philosopher's rebuttal text
 */
async function generatePhilosopherRebuttal(
  env,
  philosopher,
  thread,
  initialReplies,
  langCode = "en",
) {
  const langName = SUPPORTED_LANGUAGES[langCode] || "English";

  const otherReplies = initialReplies
    .filter((r) => r.philosopher_name !== philosopher.name)
    .map((r) => `[${r.philosopher_name}]: ${r.content}`)
    .join("\n\n");

  const ownReply = initialReplies.find(
    (r) => r.philosopher_name === philosopher.name,
  );
  const ownReplyText = ownReply ? ownReply.content : "(You did not speak yet.)";

  // Philosopher-specific system prompt for rebuttal round — maximum confrontation
  const systemPrompt = `You ARE ${philosopher.name}. This is the REBUTTAL ROUND — you have read everyone's arguments and now you FIGHT BACK.

IDENTITY:
- Name: ${philosopher.name}
- Era: ${philosopher.era}
- School: ${philosopher.school}
- Rhetorical style: ${philosopher.style}

You think, argue, and reason EXCLUSIVELY through ${philosopher.school}. Your counterarguments come from YOUR philosophical tradition — not generic reasoning.

THIS IS WHERE THE DEBATE GETS HEATED. You have read the other philosophers' arguments. Some of them are WRONG — fundamentally, philosophically wrong — from your perspective. Say so. Explain exactly WHY their school of thought leads them astray on this topic. The audience is here to learn from the CLASH of ideas.

LANGUAGE: You MUST write your ENTIRE response in ${langName}. Every word in ${langName}. No exceptions.`;

  const prompt = `═══ YOUR PHILOSOPHICAL ARSENAL ═══
Primary works: ${philosopher.works}

CORE DOCTRINES (from your actual writings):
${philosopher.doctrines}

YOUR DOCUMENTED STANCES ON KEY TOPICS:
${philosopher.stances}
═══ END ARSENAL ═══

THE DEBATE:
Topic: "${thread.title}"
Context: ${thread.content}

YOUR INITIAL ARGUMENT:
${ownReplyText}

OTHER PHILOSOPHERS' ARGUMENTS:
${otherReplies || "(No other philosophers spoke.)"}

═══ REBUTTAL INSTRUCTIONS ═══
You have now read all initial arguments. The audience learns the most from watching philosophers DISAGREE. This is your chance to:
1. TARGET the argument that most contradicts your school of thought. Name the philosopher, quote or paraphrase their specific claim, and DISMANTLE it using your framework. Explain the fundamental philosophical error their school makes.
2. If another philosopher's school of thought leads to a dangerous or absurd conclusion on this topic, SAY SO and explain why.
3. Defend your initial position — if anyone challenged or contradicted you, show why YOUR school's reasoning is superior on this point.
4. Deepen your argument with a new angle or evidence from your works that wasn't in your initial statement. Advance the debate, don't repeat yourself.
5. Agreement is ONLY acceptable when two schools genuinely share a principle — and even then, explain how you ARRIVE at agreement through different reasoning.

RULES:
- Stay IN CHARACTER as ${philosopher.name}. Use first person.
- Every argument MUST be deducible from your documented works and doctrines.
- Address at least 2 other philosophers BY NAME — quote or paraphrase their specific claims before dismantling them.
- Your tone, sentence structure, and argumentation pattern must be distinctly YOURS: ${philosopher.style.split(".")[0].toLowerCase()}.
- Do NOT be diplomatic. Do NOT soften disagreements. The educational value IS the disagreement. Be intellectually ruthless but always grounded in your actual philosophy.
- Keep between 150-250 words. Be sharp and direct.
- Write in ${langName}.

Respond with ONLY your rebuttal text. No prefix.`;

  const rebuttal = await callGrok(prompt, langName, env, {
    systemPrompt,
    temperature: 0.65,
  });
  return rebuttal;
}

// ============================================================
// PARALLEL GENERATION ORCHESTRATORS (for user-proposed colloquiums)
// ============================================================

/**
 * Create the colloquium thread + proposer access + translate title/content.
 * This is the SYNCHRONOUS part that runs within the HTTP request.
 *
 * @param {object} env - Worker env
 * @param {string} userId - The proposing user's ID
 * @param {string} title - User's proposed topic title
 * @param {string} content - User's proposed topic description
 * @param {string[]} philosopherNames - Names of selected philosophers
 * @param {string} visibility - "open" or "closed"
 * @param {string} langCode - User's chosen language code
 * @returns {object} { success, threadId, title } or { success: false, reason }
 */
export async function createColloquiumThread(
  env,
  userId,
  title,
  content,
  philosopherNames,
  visibility = "open",
  langCode = "en",
) {
  console.log(
    `[Colloquium] Creating thread for ${userId} (lang: ${langCode})...`,
  );

  const today = new Date().toISOString().split("T")[0];
  const autoVerdictAt = new Date(Date.now() + 59 * 60 * 1000).toISOString(); // 59 minutes

  // Resolve philosopher profiles
  const selectedPhilosophers = philosopherNames
    .map((name) => findPhilosopher(name))
    .filter(Boolean);

  if (selectedPhilosophers.length === 0) {
    return { success: false, reason: "No valid philosophers selected" };
  }

  // Pre-translate title and content (2 Gemini calls in parallel)
  console.log("[Colloquium] Pre-translating user topic...");
  const topicTranslations = await translateTitleAndContent(title, content, env);

  // Create the thread
  const thread = await pg(env, "POST", "forum_threads", {
    body: {
      user_id: SYSTEM_USER_ID,
      title,
      content,
      category: "colloquium",
      is_pinned: false,
      metadata: {
        type: "academic_colloquium",
        colloquium_type: "user_proposed",
        visibility,
        date: today,
        proposer_id: userId,
        lang: langCode,
        philosophers: selectedPhilosophers.map((p) => p.name),
        philosopher_prices: selectedPhilosophers.reduce(
          (acc, p) => ({ ...acc, [p.name]: getPhilosopherPrice(p.name) }),
          {},
        ),
        philosopher_index: 0,
        next_philosopher_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(), // First philosopher speaks 3 min after creation
        auto_verdict_at: autoVerdictAt,
        rebuttals_complete: false,
        invited_users: [],
        translations: {
          title: topicTranslations.title,
          content: topicTranslations.content,
        },
      },
    },
    single: true,
  });

  if (!thread) {
    console.error("[Colloquium] Failed to create thread");
    return { success: false, reason: "Thread creation failed" };
  }

  console.log(`[Colloquium] Thread created: ${thread.id}`);

  // Grant proposer full access
  await pg(env, "POST", "colloquium_access", {
    body: {
      user_id: userId,
      thread_id: thread.id,
      access_type: "proposer",
      credits_spent: 5,
    },
  });

  return { success: true, threadId: thread.id, title };
}

/**
 * Generate ALL initial philosopher replies in PARALLEL, each in the user's language,
 * then translate each to all 18 languages.
 * Runs in ctx.waitUntil() (background after HTTP response).
 *
 * @param {object} env - Worker env
 * @param {string} threadId - The colloquium thread ID
 * @param {string[]} philosopherNames - Philosopher names
 * @param {string} title - Thread title
 * @param {string} content - Thread content/context
 * @param {string} langCode - User's chosen language code
 */
export async function generateAllPhilosopherReplies(
  env,
  threadId,
  philosopherNames,
  title,
  content,
  langCode = "en",
) {
  const selectedPhilosophers = philosopherNames
    .map((name) => findPhilosopher(name))
    .filter(Boolean);

  console.log(
    `[Colloquium] Generating ${selectedPhilosophers.length} initial replies SEQUENTIALLY (lang: ${langCode})...`,
  );

  // Generate replies sequentially — each philosopher sees ALL previous replies
  // before speaking. This mirrors the Daily Colloquium quality where later
  // philosophers reference, confront, and build on earlier arguments.
  let succeeded = 0;

  for (let i = 0; i < selectedPhilosophers.length; i++) {
    const philosopher = selectedPhilosophers[i];
    try {
      // Fetch all replies so far (previous philosophers' arguments)
      const currentReplies =
        (await pg(env, "GET", "forum_replies", {
          filter: `thread_id=eq.${threadId}`,
          select: "content,is_philosopher,philosopher_name,user_id",
          order: "created_at.asc",
        })) || [];

      // Skip if this philosopher already replied (duplicate prevention)
      if (
        currentReplies.some(
          (r) => r.is_philosopher && r.philosopher_name === philosopher.name,
        )
      ) {
        console.log(
          `[Colloquium] ${philosopher.name} already replied in ${threadId}, skipping`,
        );
        continue;
      }

      const enriched = currentReplies.map((r) => ({
        content: r.content,
        philosopher_name: r.philosopher_name,
        author: r.philosopher_name || "A Philosify user",
      }));

      const replyText = await generatePhilosopherReply(
        env,
        philosopher,
        { id: threadId, title, content },
        enriched,
        langCode,
      );

      // Translate to all languages
      const replyTranslations = await translateToAllLanguages(replyText, env);

      // If the source language is not English, ensure the source text is stored
      // under the correct langCode key
      if (langCode !== "en" && replyTranslations) {
        replyTranslations[langCode] = replyText;
      }

      // Insert the reply
      await pg(env, "POST", "forum_replies", {
        body: {
          thread_id: threadId,
          user_id: SYSTEM_USER_ID,
          content: replyText,
          is_philosopher: true,
          philosopher_name: philosopher.name,
          metadata: {
            translations: replyTranslations,
            reply_type: "initial",
          },
        },
      });

      // Notify frontend of new reply
      await broadcastColloquiumEvent(env, threadId, "new-reply");

      succeeded++;
      console.log(
        `[Colloquium] ${philosopher.name} replied (${i + 1}/${selectedPhilosophers.length}, ${replyText.length} chars)`,
      );
    } catch (err) {
      console.error(
        `[Colloquium] ${philosopher.name} initial reply failed:`,
        err.message,
      );
    }
  }

  // Update reply count
  await pg(env, "PATCH", "forum_threads", {
    filter: `id=eq.${threadId}`,
    body: {
      reply_count: succeeded,
      last_reply_at: new Date().toISOString(),
    },
  });

  console.log(
    `[Colloquium] Initial replies complete: ${succeeded}/${selectedPhilosophers.length}`,
  );

  return { succeeded, total: selectedPhilosophers.length };
}

/**
 * Generate ALL philosopher REBUTTALS in PARALLEL. Each philosopher reads
 * all initial replies and responds to the most interesting points.
 * Runs in ctx.waitUntil() (background, after initial replies complete).
 *
 * @param {object} env - Worker env
 * @param {string} threadId - The colloquium thread ID
 * @param {string[]} philosopherNames - Philosopher names
 * @param {string} langCode - User's chosen language code
 */
export async function generateAllPhilosopherRebuttals(
  env,
  threadId,
  philosopherNames,
  langCode = "en",
) {
  const selectedPhilosophers = philosopherNames
    .map((name) => findPhilosopher(name))
    .filter(Boolean);

  // Fetch the thread for title/content
  const threads = await pg(env, "GET", "forum_threads", {
    filter: `id=eq.${threadId}`,
    select: "id,title,content,metadata",
    limit: 1,
  });

  if (!threads || threads.length === 0) {
    console.error(`[Colloquium] Thread ${threadId} not found for rebuttals`);
    return;
  }

  const thread = threads[0];

  // Fetch all initial replies
  const initialReplies =
    (await pg(env, "GET", "forum_replies", {
      filter: `thread_id=eq.${threadId}&is_philosopher=eq.true`,
      select: "content,philosopher_name,metadata",
      order: "created_at.asc",
    })) || [];

  // Filter to initial replies only (not rebuttals)
  const initialOnly = initialReplies.filter(
    (r) => !r.metadata?.reply_type || r.metadata?.reply_type === "initial",
  );

  console.log(
    `[Colloquium] Generating ${selectedPhilosophers.length} rebuttals in parallel (lang: ${langCode})...`,
  );

  // Generate all rebuttals in parallel
  const rebuttalResults = await Promise.allSettled(
    selectedPhilosophers.map(async (philosopher) => {
      try {
        // Pre-check: skip if this philosopher already has a rebuttal
        const existingRebuttal = initialReplies.find(
          (r) =>
            r.philosopher_name === philosopher.name &&
            r.metadata?.reply_type === "rebuttal",
        );
        if (existingRebuttal) {
          console.log(
            `[Colloquium] ${philosopher.name} already has rebuttal in ${threadId}, skipping`,
          );
          return { skipped: true };
        }

        const rebuttalText = await generatePhilosopherRebuttal(
          env,
          philosopher,
          thread,
          initialOnly,
          langCode,
        );

        // Translate to all languages
        const rebuttalTranslations = await translateToAllLanguages(
          rebuttalText,
          env,
        );

        if (langCode !== "en" && rebuttalTranslations) {
          rebuttalTranslations[langCode] = rebuttalText;
        }

        // Post-check: re-verify no duplicate was inserted during generation
        const recheckRebuttals =
          (await pg(env, "GET", "forum_replies", {
            filter: `thread_id=eq.${threadId}&is_philosopher=eq.true&philosopher_name=eq.${encodeURIComponent(philosopher.name)}`,
            select: "id,metadata",
          })) || [];
        const hasRebuttal = recheckRebuttals.some(
          (r) => r.metadata?.reply_type === "rebuttal",
        );
        if (hasRebuttal) {
          console.log(
            `[Colloquium] ${philosopher.name} rebuttal inserted by parallel process in ${threadId}, skipping`,
          );
          return { skipped: true };
        }

        // Insert the rebuttal
        await pg(env, "POST", "forum_replies", {
          body: {
            thread_id: threadId,
            user_id: SYSTEM_USER_ID,
            content: rebuttalText,
            is_philosopher: true,
            philosopher_name: philosopher.name,
            metadata: {
              translations: rebuttalTranslations,
              reply_type: "rebuttal",
            },
          },
        });

        // Notify frontend of new rebuttal
        await broadcastColloquiumEvent(env, threadId, "new-reply");

        console.log(
          `[Colloquium] ${philosopher.name} rebuttal done (${rebuttalText.length} chars)`,
        );
        return { philosopher: philosopher.name, success: true };
      } catch (err) {
        console.error(
          `[Colloquium] ${philosopher.name} rebuttal failed:`,
          err.message,
        );
        return { philosopher: philosopher.name, success: false };
      }
    }),
  );

  const succeeded = rebuttalResults.filter(
    (r) => r.status === "fulfilled" && r.value?.success,
  ).length;

  // Update reply count and mark rebuttals complete
  const currentThread = await pg(env, "GET", "forum_threads", {
    filter: `id=eq.${threadId}`,
    select: "reply_count,metadata",
    limit: 1,
  });

  const existingCount =
    currentThread && currentThread[0] ? currentThread[0].reply_count || 0 : 0;
  const existingMeta =
    currentThread && currentThread[0] ? currentThread[0].metadata || {} : {};

  await pg(env, "PATCH", "forum_threads", {
    filter: `id=eq.${threadId}`,
    body: {
      reply_count: existingCount + succeeded,
      last_reply_at: new Date().toISOString(),
      metadata: {
        ...existingMeta,
        rebuttals_complete: true,
      },
    },
  });

  // Notify frontend that rebuttals are complete (verdict button can appear)
  await broadcastColloquiumEvent(env, threadId, "thread-updated");

  console.log(
    `[Colloquium] Rebuttals complete: ${succeeded}/${selectedPhilosophers.length}`,
  );

  return { succeeded, total: selectedPhilosophers.length };
}

// ============================================================
// NOTIFY ALL USERS OF NEW COLLOQUIUM
// ============================================================

/**
 * Send push notification to every user with push subscriptions.
 * Works for all colloquium types: daily, user_proposed, open_debate.
 *
 * @param {Object} env - Cloudflare Worker env
 * @param {string} threadId - Forum thread UUID
 * @param {string} title - Colloquium title
 * @param {"daily"|"user_proposed"|"open_debate"} colloquiumType - Type of colloquium
 */
export async function notifyAllUsersOfNewColloquium(
  env,
  threadId,
  title,
  colloquiumType = "daily",
) {
  try {
    const rows = await pg(env, "GET", "push_subscriptions", {
      select: "user_id",
      limit: 10000,
    });
    if (!rows || rows.length === 0) return;

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const siteUrl = env.SITE_URL || "https://philosify.org";
    const colloquiumUrl = `${siteUrl}/debate/${threadId}`;

    // Vary the message body based on colloquium type
    const bodyMap = {
      daily: `New Daily Colloquium: "${title}" — Join the debate`,
      user_proposed: `New Colloquium: "${title}" — Join the debate`,
      open_debate: `New Open Debate: "${title}" — Join the debate`,
    };
    const body = bodyMap[colloquiumType] || bodyMap.daily;

    console.log(
      `[Colloquium] Sending push invite to ${userIds.length} user(s) for ${colloquiumType} colloquium`,
    );

    const results = await Promise.allSettled(
      userIds.map((userId) =>
        sendPushNotification(env, userId, {
          title: "Philosify",
          body,
          url: colloquiumUrl,
          tag: `colloquium-${colloquiumType}-${threadId}`,
          type: "colloquium",
        }),
      ),
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value?.sent > 0,
    ).length;
    console.log(
      `[Colloquium] Push invites sent: ${sent}/${userIds.length} users`,
    );
  } catch (err) {
    console.error("[Colloquium] Failed to send push invites:", err.message);
  }
}

// ============================================================
// CREATE COLLOQUIUM THREAD
// ============================================================

/**
 * Create today's colloquium thread and insert the first 2 philosopher replies.
 * Called at 08:00 UTC.
 */
async function createColloquium(env) {
  console.log("[Colloquium] Creating daily colloquium (Type 1)...");

  // Check if we already created one today
  const today = new Date().toISOString().split("T")[0];
  const existing = await pg(env, "GET", "forum_threads", {
    filter: `category=eq.colloquium&created_at=gte.${today}T00:00:00Z&created_at=lt.${today}T23:59:59Z`,
    select: "id,metadata",
    limit: 5,
  });

  // Only skip if a Type 1 (daily) already exists
  const dailyExists = (existing || []).some(
    (t) => t.metadata?.colloquium_type === "daily",
  );
  if (dailyExists) {
    console.log(
      "[Colloquium] Daily colloquium already created today, skipping",
    );
    return { success: false, reason: "Already created today" };
  }

  // Generate topic with 2 philosophers (Type 1)
  const { title, content, selectedPhilosophers } =
    await generateColloquiumTopic(env, 2);
  console.log(
    `[Colloquium] Topic: "${title}" with ${selectedPhilosophers.length} philosophers`,
  );

  // Pre-translate title and content into all 18 languages
  console.log("[Colloquium] Pre-translating topic...");
  const topicTranslations = await translateTitleAndContent(title, content, env);

  // Create the thread (service role — bypasses auth)
  const thread = await pg(env, "POST", "forum_threads", {
    body: {
      user_id: SYSTEM_USER_ID,
      title,
      content,
      category: "colloquium",
      is_pinned: true,
      metadata: {
        type: "academic_colloquium",
        colloquium_type: "daily",
        date: today,
        philosophers: selectedPhilosophers.map((p) => p.name),
        philosopher_prices: selectedPhilosophers.reduce(
          (acc, p) => ({ ...acc, [p.name]: getPhilosopherPrice(p.name) }),
          {},
        ),
        philosopher_index: 0,
        translations: {
          title: topicTranslations.title,
          content: topicTranslations.content,
        },
      },
    },
    single: true,
  });

  if (!thread) {
    console.error("[Colloquium] Failed to create thread");
    return { success: false, reason: "Thread creation failed" };
  }

  console.log(`[Colloquium] Thread created: ${thread.id}`);

  // Generate first 2 philosopher replies immediately (with pre-translation)
  for (let i = 0; i < Math.min(2, selectedPhilosophers.length); i++) {
    const philosopher = selectedPhilosophers[i];
    try {
      const currentReplies = await pg(env, "GET", "forum_replies", {
        filter: `thread_id=eq.${thread.id}`,
        select: "content,is_philosopher,philosopher_name",
        order: "created_at.asc",
      });

      // Skip if this philosopher already replied (duplicate prevention)
      if (
        (currentReplies || []).some(
          (r) => r.is_philosopher && r.philosopher_name === philosopher.name,
        )
      ) {
        console.log(
          `[Colloquium] Daily: ${philosopher.name} already replied in ${thread.id}, skipping`,
        );
        continue;
      }

      const replyText = await generatePhilosopherReply(
        env,
        philosopher,
        { id: thread.id, title, content },
        currentReplies || [],
      );

      // Pre-translate the reply
      const replyTranslations = await translateToAllLanguages(replyText, env);

      await pg(env, "POST", "forum_replies", {
        body: {
          thread_id: thread.id,
          user_id: SYSTEM_USER_ID,
          content: replyText,
          is_philosopher: true,
          philosopher_name: philosopher.name,
          metadata: { translations: replyTranslations },
        },
      });

      // Notify frontend of new reply
      await broadcastColloquiumEvent(env, thread.id, "new-reply");

      console.log(
        `[Colloquium] ${philosopher.name} replied (${replyText.length} chars, translated)`,
      );
    } catch (err) {
      console.error(
        `[Colloquium] ${philosopher.name} reply failed:`,
        err.message,
      );
    }
  }

  // Update philosopher_index to 2 (next philosopher to speak)
  await pg(env, "PATCH", "forum_threads", {
    filter: `id=eq.${thread.id}`,
    body: {
      metadata: {
        ...thread.metadata,
        ...{
          type: "academic_colloquium",
          colloquium_type: "daily",
          date: today,
          philosophers: selectedPhilosophers.map((p) => p.name),
          philosopher_prices: selectedPhilosophers.reduce(
            (acc, p) => ({ ...acc, [p.name]: getPhilosopherPrice(p.name) }),
            {},
          ),
          philosopher_index: 2,
          translations: {
            title: topicTranslations.title,
            content: topicTranslations.content,
          },
        },
      },
      reply_count: 2,
    },
  });

  // Notify frontend of thread update
  await broadcastColloquiumEvent(env, thread.id, "thread-updated");

  // Send push invitation to all users with push subscriptions
  await notifyAllUsersOfNewColloquium(env, thread.id, title, "daily");

  return { success: true, threadId: thread.id, title };
}

// ============================================================
// ADD PHILOSOPHER REPLY (staggered cron)
// ============================================================

/**
 * Add the next philosopher's reply to today's colloquium.
 * Called at 11:00, 14:00, 17:00, 20:00 UTC.
 */
async function addPhilosopherReply(env) {
  console.log("[Colloquium] Adding philosopher reply...");

  // Find today's colloquium thread
  const today = new Date().toISOString().split("T")[0];
  const threads = await pg(env, "GET", "forum_threads", {
    filter: `category=eq.colloquium&created_at=gte.${today}T00:00:00Z&created_at=lt.${today}T23:59:59Z`,
    select: "id,title,content,metadata,wrapup",
    limit: 1,
    order: "created_at.desc",
  });

  if (!threads || threads.length === 0) {
    console.log("[Colloquium] No colloquium thread found for today");
    return { success: false, reason: "No colloquium today" };
  }

  const thread = threads[0];

  // Don't add replies after wrapup
  if (thread.wrapup) {
    console.log("[Colloquium] Colloquium already wrapped up, skipping");
    return { success: false, reason: "Already wrapped up" };
  }

  const metadata = thread.metadata || {};
  const philosopherNames = metadata.philosophers || [];
  const nextIndex = metadata.philosopher_index || 0;

  if (nextIndex >= philosopherNames.length) {
    console.log("[Colloquium] All philosophers have spoken");
    return { success: false, reason: "All philosophers done" };
  }

  // Find the next philosopher that hasn't already been handled by on-demand add
  const userAdded = new Set(metadata.user_added_philosophers || []);
  let currentIndex = nextIndex;
  while (
    currentIndex < philosopherNames.length &&
    userAdded.has(philosopherNames[currentIndex])
  ) {
    console.log(
      `[Colloquium] Skipping ${philosopherNames[currentIndex]} (already added on-demand by user)`,
    );
    currentIndex++;
  }

  if (currentIndex >= philosopherNames.length) {
    console.log(
      "[Colloquium] All philosophers have spoken (including user-added skips)",
    );
    // Update philosopher_index to reflect skipped entries
    if (currentIndex !== nextIndex) {
      await pg(env, "PATCH", "forum_threads", {
        filter: `id=eq.${thread.id}`,
        body: {
          metadata: { ...metadata, philosopher_index: currentIndex },
        },
      });
    }
    return { success: false, reason: "All philosophers done" };
  }

  const philosopherName = philosopherNames[currentIndex];
  const philosopher = PHILOSOPHERS.find((p) => p.name === philosopherName);
  if (!philosopher) {
    console.error(`[Colloquium] Philosopher not found: ${philosopherName}`);
    return {
      success: false,
      reason: `Philosopher not found: ${philosopherName}`,
    };
  }

  // Fetch all existing replies (philosopher + user comments)
  const existingReplies = await pg(env, "GET", "forum_replies", {
    filter: `thread_id=eq.${thread.id}`,
    select: "content,is_philosopher,philosopher_name,user_id",
    order: "created_at.asc",
  });

  // Enrich non-philosopher replies with display names
  const enriched = (existingReplies || []).map((r) => ({
    content: r.content,
    philosopher_name: r.philosopher_name,
    author: r.philosopher_name || "A Philosify user",
  }));

  try {
    // Pre-check: skip if this philosopher already replied
    const alreadyReplied = (existingReplies || []).some(
      (r) => r.is_philosopher && r.philosopher_name === philosopher.name,
    );
    if (alreadyReplied) {
      console.log(
        `[Colloquium] ${philosopher.name} already replied in ${thread.id}, skipping`,
      );
      // Still advance the index
      await pg(env, "PATCH", "forum_threads", {
        filter: `id=eq.${thread.id}`,
        body: {
          metadata: { ...metadata, philosopher_index: currentIndex + 1 },
        },
      });
      return { success: false, reason: "Already replied" };
    }

    const replyText = await generatePhilosopherReply(
      env,
      philosopher,
      thread,
      enriched,
    );

    // Pre-translate the reply into all languages
    const replyTranslations = await translateToAllLanguages(replyText, env);

    // Post-check: re-verify no duplicate was inserted during generation
    const recheckReplies =
      (await pg(env, "GET", "forum_replies", {
        filter: `thread_id=eq.${thread.id}&is_philosopher=eq.true&philosopher_name=eq.${encodeURIComponent(philosopher.name)}`,
        select: "id",
        limit: 1,
      })) || [];
    if (recheckReplies.length > 0) {
      console.log(
        `[Colloquium] ${philosopher.name} inserted by parallel process in ${thread.id}, aborting`,
      );
      // Still advance the index
      await pg(env, "PATCH", "forum_threads", {
        filter: `id=eq.${thread.id}`,
        body: {
          metadata: { ...metadata, philosopher_index: currentIndex + 1 },
        },
      });
      return { success: false, reason: "Inserted by parallel process" };
    }

    await pg(env, "POST", "forum_replies", {
      body: {
        thread_id: thread.id,
        user_id: SYSTEM_USER_ID,
        content: replyText,
        is_philosopher: true,
        philosopher_name: philosopher.name,
        metadata: { translations: replyTranslations },
      },
    });

    // Notify frontend of new reply
    await broadcastColloquiumEvent(env, thread.id, "new-reply");

    // Update philosopher_index and reply_count
    // Use currentIndex (which may have skipped user-added philosophers)
    await pg(env, "PATCH", "forum_threads", {
      filter: `id=eq.${thread.id}`,
      body: {
        metadata: {
          ...metadata,
          philosopher_index: currentIndex + 1,
        },
        reply_count: (existingReplies || []).length + 1,
        last_reply_at: new Date().toISOString(),
      },
    });

    console.log(
      `[Colloquium] ${philosopher.name} replied (${replyText.length} chars, translated)`,
    );
    return { success: true, philosopher: philosopher.name };
  } catch (err) {
    console.error(
      `[Colloquium] ${philosopher.name} reply failed:`,
      err.message,
    );
    return { success: false, reason: err.message };
  }
}

// ============================================================
// AUTO-VERDICT (wrapup at 23:00 UTC)
// ============================================================

/**
 * Generate the final verdict for today's colloquium.
 * Mirrors the logic in forum.js handleDebateWrapup but runs
 * automatically without user auth.
 */
async function generateColloquiumVerdict(env) {
  console.log("[Colloquium] Generating verdict for daily colloquium...");

  // Find today's daily colloquium
  const today = new Date().toISOString().split("T")[0];
  const threads = await pg(env, "GET", "forum_threads", {
    filter: `category=eq.colloquium&created_at=gte.${today}T00:00:00Z&created_at=lt.${today}T23:59:59Z`,
    select: "id,title,content,metadata,wrapup",
    limit: 5,
    order: "created_at.desc",
  });

  if (!threads || threads.length === 0) {
    console.log("[Colloquium] No colloquium found for today");
    return { success: false, reason: "No colloquium today" };
  }

  // Find the daily one
  const thread = threads.find(
    (t) =>
      t.metadata?.colloquium_type === "daily" || !t.metadata?.colloquium_type,
  );

  if (!thread) {
    console.log("[Colloquium] No daily colloquium found");
    return { success: false, reason: "No daily colloquium" };
  }

  return generateColloquiumVerdictForThread(env, thread);
}

// ============================================================
// TYPE 2: USER-PROPOSED COLLOQUIUM GENERATION
// ============================================================

/**
 * Generate a complete user-proposed colloquium (Type 2).
 * All philosopher replies are generated immediately.
 * Verdict will auto-generate after 60 minutes.
 *
 * @param {object} env - Worker env
 * @param {string} userId - The proposing user's ID
 * @param {string} userTitle - User's proposed topic title
 * @param {string} userContent - User's proposed topic description
 * @param {string[]} philosopherNames - Names of philosophers to participate (4 AI-chosen)
 * @returns {object} { success, threadId, title }
 */
export async function createUserColloquium(
  env,
  userId,
  userTitle,
  userContent,
  philosopherNames,
  visibility = "open",
) {
  console.log(
    `[Colloquium] Creating user-proposed colloquium (Type 2) for ${userId}...`,
  );

  const today = new Date().toISOString().split("T")[0];
  const verdictAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 minutes from now

  // Resolve philosopher profiles
  const selectedPhilosophers = philosopherNames
    .map((name) => findPhilosopher(name))
    .filter(Boolean);

  if (selectedPhilosophers.length === 0) {
    return { success: false, reason: "No valid philosophers selected" };
  }

  // Pre-translate title and content
  console.log("[Colloquium] Pre-translating user topic...");
  const topicTranslations = await translateTitleAndContent(
    userTitle,
    userContent,
    env,
  );

  // Create the thread
  const thread = await pg(env, "POST", "forum_threads", {
    body: {
      user_id: SYSTEM_USER_ID,
      title: userTitle,
      content: userContent,
      category: "colloquium",
      is_pinned: false,
      metadata: {
        type: "academic_colloquium",
        colloquium_type: "user_proposed",
        visibility: visibility,
        date: today,
        proposer_id: userId,
        philosophers: selectedPhilosophers.map((p) => p.name),
        philosopher_prices: selectedPhilosophers.reduce(
          (acc, p) => ({ ...acc, [p.name]: getPhilosopherPrice(p.name) }),
          {},
        ),
        philosopher_index: selectedPhilosophers.length,
        verdict_at: verdictAt,
        invited_users: [],
        translations: {
          title: topicTranslations.title,
          content: topicTranslations.content,
        },
      },
    },
    single: true,
  });

  if (!thread) {
    console.error("[Colloquium] Failed to create user colloquium thread");
    return { success: false, reason: "Thread creation failed" };
  }

  console.log(`[Colloquium] User colloquium created: ${thread.id}`);

  // Grant proposer full access
  await pg(env, "POST", "colloquium_access", {
    body: {
      user_id: userId,
      thread_id: thread.id,
      access_type: "proposer",
      credits_spent: 5,
    },
  });

  // Generate ALL philosopher replies immediately (in sequence for context)
  for (let i = 0; i < selectedPhilosophers.length; i++) {
    const philosopher = selectedPhilosophers[i];
    try {
      const currentReplies = await pg(env, "GET", "forum_replies", {
        filter: `thread_id=eq.${thread.id}`,
        select: "content,is_philosopher,philosopher_name",
        order: "created_at.asc",
      });

      const replyText = await generatePhilosopherReply(
        env,
        philosopher,
        { id: thread.id, title: userTitle, content: userContent },
        currentReplies || [],
      );

      // Pre-translate
      const replyTranslations = await translateToAllLanguages(replyText, env);

      await pg(env, "POST", "forum_replies", {
        body: {
          thread_id: thread.id,
          user_id: SYSTEM_USER_ID,
          content: replyText,
          is_philosopher: true,
          philosopher_name: philosopher.name,
          metadata: { translations: replyTranslations },
        },
      });

      // Notify frontend of new reply
      await broadcastColloquiumEvent(env, thread.id, "new-reply");

      console.log(
        `[Colloquium] ${philosopher.name} replied (${replyText.length} chars)`,
      );
    } catch (err) {
      console.error(
        `[Colloquium] ${philosopher.name} reply failed:`,
        err.message,
      );
    }
  }

  // Update reply count
  await pg(env, "PATCH", "forum_threads", {
    filter: `id=eq.${thread.id}`,
    body: {
      reply_count: selectedPhilosophers.length,
      last_reply_at: new Date().toISOString(),
    },
  });

  return { success: true, threadId: thread.id, title: userTitle };
}

/**
 * Add a single philosopher's reply on-demand (when a user pays to add one).
 * The reply is generated immediately and pre-translated.
 *
 * @param {object} env - Worker env
 * @param {string} threadId - The colloquium thread ID
 * @param {string} philosopherName - Name of the philosopher to add
 * @returns {object} { success, reply }
 */
export async function addPhilosopherOnDemand(env, threadId, philosopherName) {
  const philosopher = findPhilosopher(philosopherName);
  if (!philosopher) {
    return {
      success: false,
      reason: `Philosopher not found: ${philosopherName}`,
    };
  }

  // Fetch thread
  const threads = await pg(env, "GET", "forum_threads", {
    filter: `id=eq.${threadId}`,
    select: "id,title,content,metadata,wrapup",
    limit: 1,
  });

  if (!threads || threads.length === 0) {
    return { success: false, reason: "Thread not found" };
  }

  const thread = threads[0];

  if (thread.wrapup) {
    return { success: false, reason: "Colloquium already has a verdict" };
  }

  // Update thread metadata: add philosopher to panel + schedule via cron
  const metadata = thread.metadata || {};
  const currentPhilosophers = metadata.philosophers || [];

  if (currentPhilosophers.includes(philosopher.name)) {
    return { success: false, reason: "Philosopher already on panel" };
  }

  const updatedPrices = {
    ...(metadata.philosopher_prices || {}),
    [philosopher.name]: getPhilosopherPrice(philosopher.name),
  };
  const userAdded = metadata.user_added_philosophers || [];

  // Determine which existing philosophers will respond to the added one
  // (only those who have already spoken)
  const existingReplies =
    (await pg(env, "GET", "forum_replies", {
      filter: `thread_id=eq.${threadId}&is_philosopher=eq.true`,
      select: "philosopher_name",
      order: "created_at.asc",
    })) || [];
  const spokenPhilosophers = [
    ...new Set(existingReplies.map((r) => r.philosopher_name).filter(Boolean)),
  ];

  // Schedule: added philosopher speaks at T+3min, then existing philosophers
  // respond at 5-min intervals (handled by cron via pending_responses)
  const FIRST_REPLY_DELAY = 3 * 60 * 1000; // 3 minutes
  const RESPONSE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const pendingResponses = metadata.pending_responses || [];
  if (spokenPhilosophers.length > 0) {
    pendingResponses.push({
      target: philosopher.name,
      from: spokenPhilosophers,
      response_index: 0,
      // First response at T+3+5 min (after added philosopher speaks at T+3)
      next_response_at: new Date(
        Date.now() + FIRST_REPLY_DELAY + RESPONSE_INTERVAL,
      ).toISOString(),
    });
  }

  // Append philosopher and set scheduling metadata
  const updatedPhilosophers = [...currentPhilosophers, philosopher.name];
  // The added philosopher will be picked up by the cron as a user-added
  // philosopher. We add them to the panel and schedule their reply.
  // Their reply is handled via next_philosopher_at if no original
  // philosophers are pending, or via a dedicated added-philosopher entry.

  // If original philosophers are still being generated, the added one
  // will speak after them. If original generation is done, schedule now.
  const originalDone =
    (metadata.philosopher_index || 0) >= currentPhilosophers.length;
  const nextPhilosopherAt = originalDone
    ? new Date(Date.now() + FIRST_REPLY_DELAY).toISOString()
    : metadata.next_philosopher_at; // Keep existing schedule

  await pg(env, "PATCH", "forum_threads", {
    filter: `id=eq.${threadId}`,
    body: {
      metadata: {
        ...metadata,
        philosophers: updatedPhilosophers,
        philosopher_prices: updatedPrices,
        user_added_philosophers: [...userAdded, philosopher.name],
        pending_responses: pendingResponses,
        // Reset philosopher_index if original generation was "done" so cron
        // picks up the newly appended philosopher
        philosopher_index: originalDone
          ? currentPhilosophers.length // Points to the new philosopher
          : metadata.philosopher_index || 0,
        next_philosopher_at: nextPhilosopherAt,
        // Discussion is no longer complete — new philosopher needs to speak
        rebuttals_complete: false,
      },
    },
  });

  // Notify frontend of updated philosopher list
  await broadcastColloquiumEvent(env, threadId, "thread-updated");

  console.log(
    `[Colloquium] Philosopher ${philosopher.name} added to panel. Cron will generate reply at ${nextPhilosopherAt}`,
  );

  return { success: true, philosopher: philosopher.name };
}

/**
 * Choose the best 4 philosophers for a given topic using AI.
 * Used for Type 2 (user-proposed) colloquiums.
 */
export async function choosePhilosophersForTopic(env, title, content) {
  const allNames = PHILOSOPHERS.map((p) => `${p.name} (${p.school})`).join(
    ", ",
  );

  const prompt = `You are selecting philosophers for a philosophical debate on Philosify.

Topic: "${title}"
Context: ${content}

Available philosophers: ${allNames}

Select exactly 4 philosophers whose DOCUMENTED beliefs would create the most interesting and genuine philosophical tension on this topic. Each philosopher must have a clear, deducible position based on their actual works.

Respond in EXACTLY this JSON format (no markdown, no code block, just raw JSON):
{"philosophers": ["Name1", "Name2", "Name3", "Name4"]}`;

  try {
    const raw = await callGrok(prompt, "English", env);
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const names = parsed.philosophers || [];

    // Validate names exist in our roster
    const valid = names
      .map((name) => {
        const found = findPhilosopher(name);
        return found ? found.name : null;
      })
      .filter(Boolean);

    if (valid.length >= 2) return valid.slice(0, 4);
  } catch (err) {
    console.warn(
      "[Colloquium] AI philosopher selection failed, using random:",
      err.message,
    );
  }

  // Fallback: random 4
  const shuffled = [...PHILOSOPHERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4).map((p) => p.name);
}

/**
 * Check for user-proposed and open_debate colloquiums whose auto-verdict time
 * has expired and generate their verdicts. Called from cron at every trigger.
 *
 * Checks both:
 * - metadata.auto_verdict_at (new field, preferred)
 * - metadata.verdict_at (legacy field for backward compat)
 */
export async function checkExpiredAutoVerdicts(env) {
  const now = new Date().toISOString();

  // Find colloquiums with no wrapup
  const threads = await pg(env, "GET", "forum_threads", {
    filter: `category=eq.colloquium&wrapup=is.null`,
    select: "id,title,content,metadata,wrapup",
    limit: 10,
    order: "created_at.desc",
  });

  if (!threads || threads.length === 0) return;

  for (const thread of threads) {
    const metadata = thread.metadata || {};
    const type = metadata.colloquium_type;

    // Only auto-verdict for user_proposed and open_debate types
    if (type !== "user_proposed" && type !== "open_debate") continue;

    // Check auto_verdict_at (new) or verdict_at (legacy)
    const autoVerdictAt = metadata.auto_verdict_at || metadata.verdict_at;
    if (!autoVerdictAt) continue;

    if (new Date(autoVerdictAt) <= new Date(now)) {
      console.log(
        `[Colloquium] Auto-verdict due for ${type} thread ${thread.id}`,
      );
      try {
        await generateColloquiumVerdictForThread(env, thread);
      } catch (err) {
        console.error(
          `[Colloquium] Auto-verdict failed for ${thread.id}:`,
          err.message,
        );
      }
    }
  }
}

/**
 * Check for user-proposed colloquiums where background generation appears
 * stuck (created > 10 minutes ago, no rebuttals_complete, no generation_failed,
 * no verdict). Re-runs the full generation pipeline.
 * Called from cron at every trigger as a safety net.
 */
async function checkStuckGeneration(env) {
  // user_proposed and open_debate threads use cron-based staggered generation
  // (checkPendingUserProposedReplies) — no stuck recovery needed here.
  // This function only handles legacy daily colloquium stuck detection if needed.
  // Currently all user-proposed/open_debate are cron-driven, so this is a no-op
  // kept for safety in case new colloquium types are added later.
  return;
}

/**
 * Generate the first philosopher reply immediately for a user-proposed
 * or open_debate thread.  Called from the propose handler via ctx.waitUntil
 * so the user sees the first philosopher speak within seconds (mirrors the
 * daily colloquium pattern where replies start at creation time).
 *
 * If this fails, the cron safety net (next_philosopher_at) handles it.
 */
export async function generateImmediateFirstReply(env, threadId) {
  const threads = await pg(env, "GET", "forum_threads", {
    filter: `id=eq.${threadId}`,
    select: "id,title,content,metadata",
    limit: 1,
  });
  if (!threads || threads.length === 0) return;

  const thread = threads[0];
  const meta = thread.metadata || {};
  const philosophers = meta.philosophers || [];
  const index = meta.philosopher_index || 0;

  if (index >= philosophers.length) return;

  const philosopherName = philosophers[index];
  const philosopher = findPhilosopher(philosopherName);
  if (!philosopher) return;

  // Check if this philosopher already has a reply (race-condition guard)
  const existingReplies =
    (await pg(env, "GET", "forum_replies", {
      filter: `thread_id=eq.${threadId}&is_philosopher=eq.true`,
      select: "philosopher_name",
    })) || [];

  if (existingReplies.some((r) => r.philosopher_name === philosopher.name)) {
    console.log(
      `[Colloquium] Immediate: ${philosopher.name} already replied in ${threadId}, skipping`,
    );
    return;
  }

  const langCode = meta.lang || "en";
  console.log(
    `[Colloquium] Generating immediate first reply: ${philosopher.name} for ${threadId}`,
  );

  const replyText = await generatePhilosopherReply(
    env,
    philosopher,
    thread,
    [],
    langCode,
  );

  const replyTranslations = await translateToAllLanguages(replyText, env);
  if (langCode !== "en" && replyTranslations) {
    replyTranslations[langCode] = replyText;
  }

  // Re-check for duplicates after generation (race-condition guard)
  const recheckReplies =
    (await pg(env, "GET", "forum_replies", {
      filter: `thread_id=eq.${threadId}&is_philosopher=eq.true&philosopher_name=eq.${encodeURIComponent(philosopher.name)}`,
      select: "id",
      limit: 1,
    })) || [];
  if (recheckReplies.length > 0) {
    console.log(
      `[Colloquium] Immediate: ${philosopher.name} inserted by parallel process in ${threadId}, aborting`,
    );
    return;
  }

  await pg(env, "POST", "forum_replies", {
    body: {
      thread_id: threadId,
      user_id: SYSTEM_USER_ID,
      content: replyText,
      is_philosopher: true,
      philosopher_name: philosopher.name,
      metadata: {
        translations: replyTranslations,
        reply_type: "initial",
      },
    },
  });

  // Advance cursor — schedule next philosopher 5 min from now
  const nextIndex = index + 1;
  const PHILOSOPHER_INTERVAL = 5 * 60 * 1000;
  const nextPhilosopherAt =
    nextIndex < philosophers.length
      ? new Date(Date.now() + PHILOSOPHER_INTERVAL).toISOString()
      : null;

  // Re-read fresh metadata to avoid stale overwrites
  const freshThread = await pg(env, "GET", "forum_threads", {
    filter: `id=eq.${threadId}`,
    select: "metadata",
    limit: 1,
  });
  const freshMeta = freshThread?.[0]?.metadata || meta;

  await pg(env, "PATCH", "forum_threads", {
    filter: `id=eq.${threadId}`,
    body: {
      metadata: {
        ...freshMeta,
        philosopher_index: nextIndex,
        next_philosopher_at: nextPhilosopherAt,
        rebuttals_complete:
          nextIndex >= philosophers.length
            ? true
            : freshMeta.rebuttals_complete,
      },
      reply_count: 1,
      last_reply_at: new Date().toISOString(),
    },
  });

  await broadcastColloquiumEvent(env, threadId, "new-reply");
  await broadcastColloquiumEvent(env, threadId, "thread-updated");

  // Push notification: philosopher joined the debate
  notifyColloquiumParticipants(env, threadId, {
    title: "Philosify",
    body: `${philosopher.name} has joined the debate`,
    url: `/debate/${threadId}`,
    tag: `colloquium-reply-${threadId}`,
    type: "colloquium",
  });

  console.log(
    `[Colloquium] Immediate: ${philosopher.name} replied (${replyText.length} chars) for ${threadId}`,
  );
}

/**
 * Check for user-proposed (and open_debate) colloquiums that have pending
 * philosopher replies scheduled via cron.  Called every 5 minutes from the
 * every-5-minutes cron trigger.
 *
 * Metadata fields used:
 *   - next_philosopher_at: ISO timestamp of when the next philosopher should speak
 *   - philosopher_index: cursor into the philosophers[] array (0-based for cron)
 *   - philosophers[]: the full panel list
 *   - pending_responses: array of { target, from[], response_index, next_response_at }
 */
export async function checkPendingUserProposedReplies(env) {
  const now = new Date();
  const nowISO = now.toISOString();

  // Find colloquiums with no verdict that might need a philosopher reply
  const threads = await pg(env, "GET", "forum_threads", {
    filter: `category=eq.colloquium&wrapup=is.null`,
    select: "id,title,content,metadata",
    limit: 20,
    order: "created_at.desc",
  });

  if (!threads || threads.length === 0) return;

  for (const thread of threads) {
    const meta = thread.metadata || {};
    const type = meta.colloquium_type;

    // Only process user_proposed and open_debate types
    if (type !== "user_proposed" && type !== "open_debate") continue;

    const philosophers = meta.philosophers || [];
    const index = meta.philosopher_index || 0;
    const nextAt = meta.next_philosopher_at;

    // ── Phase 1: Generate next philosopher reply ──
    if (index < philosophers.length && nextAt && new Date(nextAt) <= now) {
      const currentIndex = index;

      if (currentIndex < philosophers.length) {
        const philosopherName = philosophers[currentIndex];
        const philosopher = findPhilosopher(philosopherName);

        if (philosopher) {
          console.log(
            `[Colloquium] Cron: generating reply for ${philosopher.name} (${currentIndex + 1}/${philosophers.length}) in thread ${thread.id}`,
          );

          try {
            // Fetch all existing replies so this philosopher sees everything
            const existingReplies =
              (await pg(env, "GET", "forum_replies", {
                filter: `thread_id=eq.${thread.id}`,
                select: "content,is_philosopher,philosopher_name,user_id",
                order: "created_at.asc",
              })) || [];

            // Skip if this philosopher already spoke (e.g. immediate generation beat the cron)
            if (
              existingReplies.some(
                (r) =>
                  r.is_philosopher && r.philosopher_name === philosopher.name,
              )
            ) {
              console.log(
                `[Colloquium] Cron: ${philosopher.name} already replied in ${thread.id}, advancing index`,
              );
              const nextIndex = currentIndex + 1;
              const nextPhilosopherAt =
                nextIndex < philosophers.length
                  ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
                  : null;
              await pg(env, "PATCH", "forum_threads", {
                filter: `id=eq.${thread.id}`,
                body: {
                  metadata: {
                    ...meta,
                    philosopher_index: nextIndex,
                    next_philosopher_at: nextPhilosopherAt,
                  },
                },
              });
              continue;
            }

            const enriched = existingReplies.map((r) => ({
              content: r.content,
              philosopher_name: r.philosopher_name,
              author: r.philosopher_name || "A Philosify user",
            }));

            const langCode = meta.lang || "en";
            const replyText = await generatePhilosopherReply(
              env,
              philosopher,
              thread,
              enriched,
              langCode,
            );

            // Translate to all languages
            const replyTranslations = await translateToAllLanguages(
              replyText,
              env,
            );
            if (langCode !== "en" && replyTranslations) {
              replyTranslations[langCode] = replyText;
            }

            // Re-check for duplicates after generation (race-condition guard)
            const recheckReplies =
              (await pg(env, "GET", "forum_replies", {
                filter: `thread_id=eq.${thread.id}&is_philosopher=eq.true&philosopher_name=eq.${encodeURIComponent(philosopher.name)}`,
                select: "id",
                limit: 1,
              })) || [];
            if (recheckReplies.length > 0) {
              console.log(
                `[Colloquium] Cron: ${philosopher.name} inserted by parallel process in ${thread.id}, skipping`,
              );
              const nextIndex = currentIndex + 1;
              const nextPhilosopherAt =
                nextIndex < philosophers.length
                  ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
                  : null;
              await pg(env, "PATCH", "forum_threads", {
                filter: `id=eq.${thread.id}`,
                body: {
                  metadata: {
                    ...meta,
                    philosopher_index: nextIndex,
                    next_philosopher_at: nextPhilosopherAt,
                  },
                },
              });
              continue;
            }

            // Insert reply
            await pg(env, "POST", "forum_replies", {
              body: {
                thread_id: thread.id,
                user_id: SYSTEM_USER_ID,
                content: replyText,
                is_philosopher: true,
                philosopher_name: philosopher.name,
                metadata: {
                  translations: replyTranslations,
                  reply_type: "initial",
                },
              },
            });

            // Schedule next philosopher (5 min from now)
            const nextIndex = currentIndex + 1;
            const PHILOSOPHER_INTERVAL = 5 * 60 * 1000; // 5 minutes
            const nextPhilosopherAt =
              nextIndex < philosophers.length
                ? new Date(Date.now() + PHILOSOPHER_INTERVAL).toISOString()
                : null;

            await pg(env, "PATCH", "forum_threads", {
              filter: `id=eq.${thread.id}`,
              body: {
                metadata: {
                  ...meta,
                  philosopher_index: nextIndex,
                  next_philosopher_at: nextPhilosopherAt,
                  // Mark discussion complete when all original philosophers have spoken
                  rebuttals_complete:
                    nextIndex >= philosophers.length
                      ? true
                      : meta.rebuttals_complete,
                },
                reply_count: existingReplies.length + 1,
                last_reply_at: new Date().toISOString(),
              },
            });

            // Notify frontend
            await broadcastColloquiumEvent(env, thread.id, "new-reply");
            await broadcastColloquiumEvent(env, thread.id, "thread-updated");

            // Push notification: philosopher joined the debate
            notifyColloquiumParticipants(env, thread.id, {
              title: "Philosify",
              body: `${philosopher.name} has joined the debate`,
              url: `/debate/${thread.id}`,
              tag: `colloquium-reply-${thread.id}`,
              type: "colloquium",
            });

            console.log(
              `[Colloquium] Cron: ${philosopher.name} replied (${currentIndex + 1}/${philosophers.length}, ${replyText.length} chars)`,
            );
          } catch (err) {
            console.error(
              `[Colloquium] Cron: ${philosopherName} reply failed for ${thread.id}: ${err.message}`,
            );
          }
        } else {
          // Philosopher not found — skip and advance index
          const nextIndex = currentIndex + 1;
          const nextPhilosopherAt =
            nextIndex < philosophers.length
              ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
              : null;
          await pg(env, "PATCH", "forum_threads", {
            filter: `id=eq.${thread.id}`,
            body: {
              metadata: {
                ...meta,
                philosopher_index: nextIndex,
                next_philosopher_at: nextPhilosopherAt,
              },
            },
          });
        }
      }
    }

    // ── Phase 2: Generate responses from existing philosophers to user-added ones ──
    const pendingResponses = meta.pending_responses || [];
    if (pendingResponses.length > 0) {
      const pr = pendingResponses[0]; // Process first pending response
      const nextResponseAt = pr.next_response_at;
      const responseIndex = pr.response_index || 0;
      const respondingPhilosophers = pr.from || [];

      if (
        nextResponseAt &&
        new Date(nextResponseAt) <= now &&
        responseIndex < respondingPhilosophers.length
      ) {
        const responderName = respondingPhilosophers[responseIndex];
        const responder = findPhilosopher(responderName);
        const targetName = pr.target;

        if (responder) {
          console.log(
            `[Colloquium] Cron: ${responder.name} responding to user-added ${targetName} in thread ${thread.id}`,
          );

          try {
            const existingReplies =
              (await pg(env, "GET", "forum_replies", {
                filter: `thread_id=eq.${thread.id}`,
                select:
                  "content,is_philosopher,philosopher_name,user_id,metadata",
                order: "created_at.asc",
              })) || [];

            // Skip if this responder already posted a response to this target
            if (
              existingReplies.some(
                (r) =>
                  r.is_philosopher &&
                  r.philosopher_name === responder.name &&
                  r.metadata?.reply_type === "response" &&
                  r.metadata?.response_to === targetName,
              )
            ) {
              console.log(
                `[Colloquium] Cron: ${responder.name} already responded to ${targetName} in ${thread.id}, advancing`,
              );
              // Advance index so we don't retry
              const nextRespIndex = responseIndex + 1;
              const updatedPR = [...pendingResponses];
              if (nextRespIndex >= respondingPhilosophers.length) {
                updatedPR.shift();
              } else {
                updatedPR[0] = {
                  ...pr,
                  response_index: nextRespIndex,
                  next_response_at: new Date(
                    Date.now() + 5 * 60 * 1000,
                  ).toISOString(),
                };
              }
              await pg(env, "PATCH", "forum_threads", {
                filter: `id=eq.${thread.id}`,
                body: {
                  metadata: { ...meta, pending_responses: updatedPR },
                },
              });
              continue;
            }

            const enriched = existingReplies.map((r) => ({
              content: r.content,
              philosopher_name: r.philosopher_name,
              author: r.philosopher_name || "A Philosify user",
            }));

            const langCode = meta.lang || "en";
            const replyText = await generatePhilosopherReply(
              env,
              responder,
              thread,
              enriched,
              langCode,
            );

            const translations = await translateToAllLanguages(replyText, env);
            if (langCode !== "en" && translations) {
              translations[langCode] = replyText;
            }

            // Re-check for duplicates after generation (race-condition guard)
            const recheckResponses =
              (await pg(env, "GET", "forum_replies", {
                filter: `thread_id=eq.${thread.id}&is_philosopher=eq.true&philosopher_name=eq.${encodeURIComponent(responder.name)}`,
                select: "id,metadata",
              })) || [];
            const alreadyResponded = recheckResponses.some(
              (r) =>
                r.metadata?.reply_type === "response" &&
                r.metadata?.response_to === targetName,
            );
            if (alreadyResponded) {
              console.log(
                `[Colloquium] Cron: ${responder.name} response to ${targetName} inserted by parallel process in ${thread.id}, skipping`,
              );
              // Advance index so we don't retry
              const nextRespIndex = responseIndex + 1;
              const updatedPR = [...pendingResponses];
              if (nextRespIndex >= respondingPhilosophers.length) {
                updatedPR.shift();
              } else {
                updatedPR[0] = {
                  ...pr,
                  response_index: nextRespIndex,
                  next_response_at: new Date(
                    Date.now() + 5 * 60 * 1000,
                  ).toISOString(),
                };
              }
              await pg(env, "PATCH", "forum_threads", {
                filter: `id=eq.${thread.id}`,
                body: {
                  metadata: { ...meta, pending_responses: updatedPR },
                },
              });
              continue;
            }

            await pg(env, "POST", "forum_replies", {
              body: {
                thread_id: thread.id,
                user_id: SYSTEM_USER_ID,
                content: replyText,
                is_philosopher: true,
                philosopher_name: responder.name,
                metadata: {
                  translations,
                  reply_type: "response",
                  response_to: targetName,
                },
              },
            });

            // Advance response index or remove this pending response
            const nextRespIndex = responseIndex + 1;
            const updatedPR = [...pendingResponses];
            if (nextRespIndex >= respondingPhilosophers.length) {
              // Done with this added philosopher's responses
              updatedPR.shift();
            } else {
              updatedPR[0] = {
                ...pr,
                response_index: nextRespIndex,
                next_response_at: new Date(
                  Date.now() + 5 * 60 * 1000,
                ).toISOString(),
              };
            }

            // Re-read thread metadata to avoid stale overwrites
            const freshThread = await pg(env, "GET", "forum_threads", {
              filter: `id=eq.${thread.id}`,
              select: "metadata,reply_count",
              limit: 1,
            });
            const freshMeta =
              freshThread && freshThread[0]
                ? freshThread[0].metadata || {}
                : meta;
            const freshCount =
              freshThread && freshThread[0]
                ? freshThread[0].reply_count || 0
                : 0;

            await pg(env, "PATCH", "forum_threads", {
              filter: `id=eq.${thread.id}`,
              body: {
                metadata: { ...freshMeta, pending_responses: updatedPR },
                reply_count: freshCount + 1,
                last_reply_at: new Date().toISOString(),
              },
            });

            await broadcastColloquiumEvent(env, thread.id, "new-reply");
            await broadcastColloquiumEvent(env, thread.id, "thread-updated");

            // Push notification: philosopher joined the debate
            notifyColloquiumParticipants(env, thread.id, {
              title: "Philosify",
              body: `${responder.name} has joined the debate`,
              url: `/debate/${thread.id}`,
              tag: `colloquium-reply-${thread.id}`,
              type: "colloquium",
            });

            console.log(
              `[Colloquium] Cron: ${responder.name} responded to ${targetName} (${replyText.length} chars)`,
            );
          } catch (err) {
            console.error(
              `[Colloquium] Cron: ${responderName} response to ${targetName} failed: ${err.message}`,
            );
          }
        }
      }
    }
  }
}

/**
 * Generate verdict for a specific thread (used by both Type 1 at 23:00
 * and Type 2 when the 60-minute window expires).
 * @param {string} [proposerLang] - If provided, translate verdict to this
 *   language during generation so the proposer sees it immediately.
 */
export async function generateColloquiumVerdictForThread(
  env,
  thread,
  proposerLang,
) {
  if (thread.wrapup) {
    console.log("[Colloquium] Verdict already exists for", thread.id);
    return { success: false, reason: "Already wrapped up" };
  }

  // Fetch all replies
  let replies = await pg(env, "GET", "forum_replies", {
    filter: `thread_id=eq.${thread.id}`,
    select:
      "id,user_id,content,upvotes,downvotes,is_philosopher,philosopher_name,created_at",
    order: "created_at.asc",
  });
  if (!replies) {
    replies = [];
  }

  console.log(
    `[Colloquium] Found ${replies.length} replies for thread ${thread.id}`,
  );

  // Load philosophical guide + source of truth + debate aesthetic guide
  let guide = "";
  let sourceOfTruth = "";
  let aestheticGuide = "";
  try {
    [guide, sourceOfTruth, aestheticGuide] = await Promise.all([
      getGuide(env).catch((err) => {
        console.error("[Colloquium] Verdict - guide_text FAILED:", err.message);
        return "";
      }),
      getWrapupSource(env).catch((err) => {
        console.warn(
          "[Colloquium] Verdict - source of truth unavailable:",
          err.message,
        );
        return "";
      }),
      getDebateAestheticGuide(env).catch((err) => {
        console.error(
          "[Colloquium] Verdict - aesthetic guide FAILED:",
          err.message,
        );
        return "";
      }),
    ]);
  } catch (loadErr) {
    console.error(
      "[Colloquium] Verdict - failed to load guides:",
      loadErr.message,
    );
  }

  // GUARD: guide_text and aesthetic guide are mandatory for verdict generation
  if (!guide) {
    console.error(
      `[Colloquium] ABORTING verdict for thread ${thread.id}: guide_text is empty`,
    );
    return {
      success: false,
      reason:
        "Philosophical guide unavailable — cannot generate verdict without it.",
    };
  }
  if (!aestheticGuide) {
    console.error(
      `[Colloquium] ABORTING verdict for thread ${thread.id}: aesthetic guide is empty`,
    );
    return {
      success: false,
      reason:
        "Aesthetic guide unavailable — cannot generate verdict without it.",
    };
  }

  // Build reply summaries enriched with philosopher school/era and user-added tag
  const allPhilosophers = thread.metadata?.philosophers || [];
  // Prefer explicit user_added_philosophers list; fall back to philosopher_index slicing
  const userAddedSet =
    (thread.metadata?.user_added_philosophers || []).length > 0
      ? new Set(thread.metadata.user_added_philosophers)
      : new Set(allPhilosophers.slice(thread.metadata?.philosopher_index || 4));

  const replySummaries = replies
    .map((r) => {
      const speaker = r.philosopher_name || "User";
      const tag = r.is_philosopher ? "(Philosopher)" : "(User)";
      const score = (r.upvotes || 0) - (r.downvotes || 0);
      let label = `[${speaker}] ${tag}`;
      if (r.is_philosopher && r.philosopher_name) {
        const profile = findPhilosopher(r.philosopher_name);
        if (profile) {
          label += ` [School: ${profile.school}] [Era: ${profile.era}]`;
        }
        if (userAddedSet.has(r.philosopher_name)) {
          label += " [ADDED BY USER]";
        }
      }
      label += ` (votes: ${score})`;
      return `${label}: ${r.content}`;
    })
    .join("\n\n");

  // Build philosopher panel list with school info
  const philosopherPanelList = allPhilosophers
    .map((name) => {
      const profile = findPhilosopher(name);
      const school = profile ? profile.school : "Unknown";
      const added = userAddedSet.has(name) ? " [ADDED BY USER]" : "";
      return `- ${name} (${school})${added}`;
    })
    .join("\n");

  // Use English translations of title/content when available so the verdict
  // prompt is fully English.  This prevents the original proposer language from
  // leaking into the verdict text (which would then persist across all 18
  // translated versions).  For daily (Type 1) colloquiums the title/content
  // are already in English so the fallback is harmless.
  const translations = thread.metadata?.translations || {};
  const verdictTitle = translations.title?.en || thread.title;
  const verdictContent = translations.content?.en || thread.content;

  let referenceSection = "";
  if (sourceOfTruth) {
    referenceSection = `
═══ AUTHORITATIVE PHILOSOPHICAL REFERENCE ═══
${sourceOfTruth}
═══ END REFERENCE ═══
`;
  }
  if (aestheticGuide) {
    referenceSection += `
═══ AESTHETIC PHILOSOPHY FRAMEWORK (Literature & Debate Sessions) ═══
${aestheticGuide}
═══ END AESTHETIC FRAMEWORK ═══
`;
  }

  const hasReplies = replies.length > 0;

  const argumentsSection = hasReplies
    ? `Total contributions: ${replies.length}

═══ ARGUMENTS ═══
${replySummaries}
═══ END ARGUMENTS ═══`
    : `Total contributions: 0 (no arguments were submitted)`;

  // ┌──────────────────────────────────────────────────────────────────────┐
  // │  VERDICT INSTRUCTIONS — MANDATORY STRUCTURE                        │
  // │                                                                    │
  // │  PROTECTED: Only the project owner may modify these instructions.  │
  // │  Every verdict MUST contain individual philosopher opinions        │
  // │  grounded in their school of thought.  This is a core product     │
  // │  requirement, not an optional style choice.                       │
  // │                                                                    │
  // │  DO NOT simplify, shorten, or remove the per-philosopher sections.│
  // │  DO NOT reduce the verdict to a generic summary.                  │
  // └──────────────────────────────────────────────────────────────────────┘
  const instructions = hasReplies
    ? `Instructions:

TONE & APPROACH:
You are writing an academic, educational, technically rigorous philosophical analysis. This is a teaching moment — the audience learns philosophy by reading your verdict. Use proper philosophical terminology. Be bold in your conclusions. Never hedge with false equivalences like "all views have merit."

SECTION 1 — **Individual Philosopher Analysis** (MANDATORY)
For EACH philosopher on the panel, write a dedicated subsection:
  **[Philosopher Name]** — *School of Thought*
  Analyze what this philosopher argued, WHY (grounded in their school), and evaluate the LOGICAL VALIDITY of their reasoning. Specifically:
  - Identify any LOGICAL FALLACIES by name (ad hominem, straw man, appeal to authority, false dichotomy, circular reasoning, equivocation, appeal to emotion, red herring, etc.)
  - Call out EVASIONS — where the philosopher dodged a direct challenge or deflected with rhetoric instead of reasoning
  - Expose CONTRADICTIONS within their own framework
  - Flag MYSTICAL APPEALS — arguments that substitute faith, intuition, or the unknowable for reason and evidence
  - Acknowledge STRONG REASONING where it exists
  Each subsection must be 3-5 sentences minimum.
  If the philosopher was ADDED BY USER, begin their subsection with: ★ (User-invited philosopher)

SECTION 2 — **Points of Agreement & Conflict**
Identify where philosophers agree and where they fundamentally clash. Reference specific schools of thought. Highlight the most illuminating disagreements — these are what make the debate educational. Distinguish between GENUINE philosophical disagreements and clashes based on FAULTY REASONING (fallacies, misrepresentations, talking past each other).

SECTION 3 — **User Contributions**
If users participated, evaluate their arguments with the SAME logical rigor but with the tone of a wise, encouraging professor:
- PRAISE strong reasoning genuinely — explain WHY it works logically
- CORRECT errors with educational generosity — "This argument would be stronger if..." or "The underlying concern here is valid, but the reasoning contains a [specific fallacy] because..."
- NEVER be arrogant, condescending, or dismissive toward users. They are here to learn. Treat every user comment as an opportunity to teach
- Help users see HOW to reason better, not just that they were wrong

SECTION 4 — **Critique of Reasoning**
Which arguments were logically valid vs. fallacious? Who engaged directly vs. who evaded? Where did mysticism, appeals to emotion, or unsupported assertions substitute for reason? This section is the EDUCATIONAL CORE — readers should learn to identify good vs. bad philosophical reasoning.

SECTION 5 — **Verdict**
Deliver the final philosophical conclusion. Which positions survive rational scrutiny? Which collapse under logical analysis? Be direct, be bold, reach a clear conclusion. Explain WHY this conclusion follows from the reasoning above. This is Philosify's judgment — grounded in logic, evidence, and philosophical rigor.

When a philosopher's premises lead to tyranny or suffering when implemented, CITE the historical evidence. Trace the chain: PREMISE → PRINCIPLE → POLICY → OUTCOME. The philosophers were bound by their era; you are not. Use history.

After stating your conclusion, end with a PROVOCATION — a question or paradox that the debate leaves unresolved. Something that invites the reader to think further. This is not indecision; the verdict is clear. But philosophy is ongoing, and the best conclusions open new questions.

RULES:
- You MUST include EVERY philosopher on the panel in Section 1. Skipping any philosopher is a failure.
- Each philosopher's analysis MUST reflect their actual school of thought and doctrines.
- ALWAYS NAME logical fallacies explicitly when they occur.
- NEVER name or label your own analytical framework. Just reason and judge.
- Keep the entire verdict under 1800 words.
- Be direct, educational, and philosophically rigorous.
- Engage with ALL philosophical schools represented, not just one.
- Write in English.
- CRITICAL: Do NOT reference internal terms like "Source of Truth", "Philosophical Guide", or any internal system labels. Speak as a philosopher delivering your own analysis.
- Do NOT include word count, character count, or any meta-commentary about the response itself.`
    : `Instructions:
No contributions were submitted for this colloquium. Deliver an independent philosophical analysis of the proposition itself.

TONE & APPROACH:
You are writing an academic, educational, technically rigorous philosophical analysis. Use proper philosophical terminology. Be bold in your conclusions.

SECTION 1 — **Philosophical Perspectives** (MANDATORY)
For EACH philosopher on the panel, write a dedicated subsection:
  **[Philosopher Name]** — *School of Thought*
  Explain how this philosopher WOULD analyze the proposition, based on their specific school of thought and doctrines. What would they argue FOR or AGAINST? Why? Identify potential logical strengths and weaknesses in their position. Each subsection must be 3-5 sentences minimum.
  If the philosopher was ADDED BY USER, begin their subsection with: ★ (User-invited philosopher)

SECTION 2 — **Points of Agreement & Conflict**
Where would these philosophers agree? Where would they fundamentally clash? Reference specific schools of thought. Highlight the most illuminating disagreements.

SECTION 3 — **Verdict**
Deliver the final philosophical analysis. Evaluate every philosophical position presented. Which hold up under rational scrutiny? Which fall into contradictions or logical fallacies? Name specific fallacies where relevant. Be direct, be bold, state the verdict without hedging. This is Philosify's judgment.

When a philosopher's premises lead to tyranny or suffering when implemented, CITE the historical evidence. Trace the chain: PREMISE → PRINCIPLE → POLICY → OUTCOME. The philosophers were bound by their era; you are not. Use history.

After stating your conclusion, end with a PROVOCATION — a question or paradox that invites the reader to think further. The verdict is clear, but philosophy is ongoing.

RULES:
- You MUST include EVERY philosopher on the panel. Skipping any philosopher is a failure.
- Each philosopher's perspective MUST reflect their actual school of thought and doctrines.
- ALWAYS NAME logical fallacies explicitly when identifying them.
- NEVER name or label your own analytical framework. Just reason and judge.
- Keep the entire verdict under 1800 words.
- Be direct, educational, and philosophically rigorous.
- Write in English.
- CRITICAL: Do NOT reference internal terms like "Source of Truth", "Philosophical Guide", or any internal system labels. Speak as a philosopher delivering your own analysis.
- Do NOT include word count, character count, or any meta-commentary about the response itself.`;

  const prompt = `You are Philosify's AI moderator concluding today's Academic Colloquium — a debate between historical philosophers and users on a proposed topic.

Your task: analyze the ENTIRE conversation — every philosopher argument, every rebuttal, every user comment — and produce a philosophical verdict.

You are a MODERN voice with access to ALL historical evidence up to the present day. The philosophers on the panel were bound by their era — they could not know the consequences of their ideas. YOU can. When Marx argues for collective ownership, YOU know about the Soviet famines and the Gulag. When racial or collectivist doctrines appear, YOU know where they led. Use this knowledge. The philosophers spoke from theory; you speak from theory AND evidence.

Your analytical compass is reason and objective reality. NEVER name or label your framework. Simply reason through the debate and arrive at your conclusions naturally.

STAY ON TOPIC — This is the most important rule. Your verdict must address ONLY what the debate is actually about. Do NOT inject principles, historical examples, or moral frameworks that the debate does not touch. If the topic is aesthetics, talk about aesthetics. If the topic is epistemology, talk about epistemology. If nobody discussed individual rights, do NOT bring up individual rights. If nobody discussed politics, do NOT bring up politics. Respond to what was argued, not to what you wish was argued. The philosophers and users set the agenda — you evaluate it.

WHEN THE DEBATE TOUCHES ETHICS OR POLITICS (and ONLY then):
- Apply virtuous self-interest as a standard: the hero lives by their own effort and does not sacrifice themselves to others or others to themselves.
- If collectivist, tribalist, or coercive positions arise IN the debate, you may EXPLAIN their appeal and then DISMANTLE them with reasoning and historical evidence. But only if a participant actually raised them.
- Trace the chain when relevant: PREMISE → PRINCIPLE → POLICY → OUTCOME. Use historical evidence (Soviet famines, Holocaust, Inquisition, etc.) ONLY when a debater's argument leads there logically. Do NOT shoehorn regime citations into unrelated topics.

ACKNOWLEDGE-CHALLENGE PATTERN — When evaluating positions that fail under scrutiny (in ANY domain, not just politics):
- ACKNOWLEDGE the appeal: "This position resonates because..."
- EXPLAIN why it fails: Walk through the logical chain step-by-step
- GROUND in evidence: historical, scientific, or philosophical as appropriate to the topic
- CHALLENGE with respect: "This argument faces a contradiction..." NOT "This is irrational"
- NEVER be arrogant or dismissive — the goal is to TEACH, not to mock
The reader should finish the verdict UNDERSTANDING why certain positions fail, not just being told they're wrong.
${referenceSection}
═══ PHILOSOPHICAL GUIDE (analytical framework) ═══
${guide || "Guide unavailable — rely on philosophical first principles: reason, objective reality, and rigorous argumentation. Apply ethical principles only when the debate topic warrants it."}
═══ END GUIDE ═══

═══ TODAY'S COLLOQUIUM ═══
Topic: ${verdictTitle}
Context: ${verdictContent}

Philosophers on panel (you MUST address EACH one individually):
${philosopherPanelList || "None"}

${argumentsSection}

${instructions}

IMPORTANT: This is a text response, NOT JSON. Write naturally with markdown formatting.`;

  let wrapupText;
  try {
    wrapupText = await callGrok(prompt, "English", env);
  } catch (grokErr) {
    console.error("[Colloquium] Grok verdict failed:", grokErr.message);
    return { success: false, reason: `Grok error: ${grokErr.message}` };
  }

  if (!wrapupText) {
    return { success: false, reason: "Empty verdict" };
  }

  console.log(`[Colloquium] Verdict received: ${wrapupText.length} chars`);

  // Save English verdict + proposer's language (if non-English).
  // Other languages are translated on-demand when users view/access the
  // colloquium.  This cuts verdict generation from ~4-5min to ~60-90s.
  const verdictTranslations = { en: wrapupText };

  // Translate to proposer's language so they see it immediately (they paid 5 credits)
  const baseLang = proposerLang?.split("-")[0];
  if (baseLang && baseLang !== "en") {
    try {
      const apiKey = await getSecret(env.GEMINI_API_KEY);
      if (apiKey) {
        const translated = await translateWithGemini(
          wrapupText,
          baseLang,
          "en",
          apiKey,
        );
        if (translated && translated !== wrapupText) {
          verdictTranslations[baseLang] = translated;
          console.log(
            `[Colloquium] Verdict translated to proposer language: ${baseLang}`,
          );
        }
      }
    } catch (err) {
      console.warn(
        `[Colloquium] Proposer language translation failed (${baseLang}): ${err.message}`,
      );
      // Non-fatal: proposer will get on-demand translation when viewing
    }
  }

  console.log(
    `[Colloquium] Verdict ready: ${Object.keys(verdictTranslations).join(",")}`,
  );

  // Re-fetch thread metadata to avoid overwriting concurrent background updates
  const freshThread = await pg(env, "GET", "forum_threads", {
    filter: `id=eq.${thread.id}`,
    select: "metadata",
    limit: 1,
  });
  const existingMetadata =
    (freshThread && freshThread[0]?.metadata) || thread.metadata || {};

  // Generate guide proof signatures (binds guide hashes to this thread ID)
  let guideProof = null;
  try {
    const proofSecret = await getSecret(env.GUIDE_PROOF_SECRET);
    if (proofSecret) {
      const [guideHash, aestheticHash] = await Promise.all([
        generateGuideProofWithSignature(
          guide,
          thread.id,
          proofSecret,
          "grok",
          env,
        ),
        generateGuideProofWithSignature(
          aestheticGuide,
          thread.id,
          proofSecret,
          "grok",
          env,
        ),
      ]);
      guideProof = {
        guide_sha256: guideHash.sha256,
        guide_version: guideHash.version,
        guide_signature: guideHash.signature,
        aesthetic_sha256: aestheticHash.sha256,
        aesthetic_signature: aestheticHash.signature,
        source_of_truth_present: !!sourceOfTruth,
        modelo: guideHash.modelo,
        generated_at: new Date().toISOString(),
      };
      console.log(`[Colloquium] Guide proof generated for thread ${thread.id}`);
    }
  } catch (proofErr) {
    console.warn(
      "[Colloquium] Guide proof generation failed (non-fatal):",
      proofErr.message,
    );
  }

  // Save verdict (text + translations + guide proof; audio generated on-demand)
  const patchResult = await pg(env, "PATCH", "forum_threads", {
    filter: `id=eq.${thread.id}`,
    body: {
      wrapup: wrapupText,
      metadata: {
        ...existingMetadata,
        translations: {
          ...(existingMetadata.translations || {}),
          wrapup: verdictTranslations,
        },
        ...(guideProof ? { guide_proof: guideProof } : {}),
      },
    },
  });

  if (!patchResult) {
    console.error(
      `[Colloquium] FAILED to save verdict for thread ${thread.id}`,
    );
    return { success: false, reason: "Failed to save verdict" };
  }

  // Notify frontend that verdict is ready
  await broadcastColloquiumEvent(env, thread.id, "thread-updated");

  // Push notification: verdict is in
  notifyColloquiumParticipants(env, thread.id, {
    title: "Philosify",
    body: "The verdict is in",
    url: `/debate/${thread.id}`,
    tag: `colloquium-verdict-${thread.id}`,
    type: "colloquium",
  });

  console.log(`[Colloquium] Verdict saved for thread ${thread.id}`);
  return { success: true, threadId: thread.id };
}

// ============================================================
// CRON DISPATCHER
// ============================================================

/**
 * Main entry point called by the scheduled() handler in index.js.
 * Dispatches to the correct function based on the current UTC hour.
 * Also checks for expired Type 2 verdicts at every cron trigger.
 *
 * @param {object} env - Worker env bindings
 * @param {number} hour - Current UTC hour (0-23)
 */
export async function handleColloquiumCron(env, hour) {
  console.log(`[Colloquium] Cron triggered at hour ${hour} UTC`);

  // Always check for expired auto-verdicts (user_proposed + open_debate)
  try {
    await checkExpiredAutoVerdicts(env);
  } catch (err) {
    console.error("[Colloquium] Auto-verdict check failed:", err.message);
  }

  // Always check for stuck background generation (user_proposed without rebuttals)
  try {
    await checkStuckGeneration(env);
  } catch (err) {
    console.error("[Colloquium] Stuck generation check failed:", err.message);
  }

  switch (hour) {
    case 8:
      return createColloquium(env);

    case 11:
    case 14:
    case 17:
    case 20:
      return addPhilosopherReply(env);

    case 23:
      return generateColloquiumVerdict(env);

    default:
      console.log(`[Colloquium] No action for hour ${hour}`);
      return { success: false, reason: `No colloquium action at hour ${hour}` };
  }
}
