-- ============================================================
-- PHILOSIFY QUIZ - Randomize Correct Answer Positions
-- ============================================================
-- Generated: 2026-04-02
-- Purpose: Redistribute correct answers evenly across a, b, c, d
-- Previous distribution: ~90% were 'b'
-- New distribution: a=34, b=34, c=33, d=33
-- Also improves implausible wrong answers to be more challenging
-- ============================================================

BEGIN;

UPDATE quiz_questions
SET options = '[{"id":"a","text":"John Locke"},{"id":"b","text":"Plato"},{"id":"c","text":"Immanuel Kant"},{"id":"d","text":"René Descartes"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Locke was an empiricist who believed knowledge comes from sensory experience, not innate reason.","b":"Plato lived nearly 2000 years before Descartes and focused on the theory of Forms.","c":"Kant built upon Descartes'' rationalism but is known for the categorical imperative, not this quote."}'
WHERE question = 'Who said: "I think, therefore I am"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"John F. Kennedy"},{"id":"b","text":"Theodore Roosevelt"},{"id":"c","text":"Franklin D. Roosevelt"},{"id":"d","text":"Winston Churchill"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"JFK is remembered for ''Ask not what your country can do for you''","b":"Theodore Roosevelt is known for ''Speak softly and carry a big stick''.","d":"Churchill is famous for ''We shall fight on the beaches'' and ''Blood, toil, tears and sweat''."}'
WHERE question = 'Who said: "The only thing we have to fear is fear itself"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Thomas Hobbes"},{"id":"b","text":"John Locke"},{"id":"c","text":"Voltaire"},{"id":"d","text":"Jean-Jacques Rousseau"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Hobbes believed man in nature was in a ''war of all against all'' - quite the opposite sentiment.","b":"Locke advocated natural rights and limited government, but this quote is Rousseau''s.","c":"Voltaire championed individual liberty and reason but didn''t write this specific line."}'
WHERE question = 'Who wrote: "Man is born free, and everywhere he is in chains"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Aristotle"},{"id":"b","text":"Ludwig Wittgenstein"},{"id":"c","text":"Bertrand Russell"},{"id":"d","text":"Ayn Rand"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Wittgenstein focused on language and meaning, not classical logic.","c":"Russell worked on mathematical logic but the Law of Identity predates him by millennia.","d":"Rand popularized ''A is A'' in modern philosophy but credited Aristotle as its originator."}'
WHERE question = 'Who said: "A is A"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Plutarch"},{"id":"b","text":"Aristotle"},{"id":"c","text":"Socrates"},{"id":"d","text":"Seneca"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Aristotle founded the Lyceum but didn''t write this specific metaphor.","c":"Socrates used the Socratic method but this quote is from Plutarch.","d":"Seneca was a Stoic philosopher with different educational metaphors."}'
WHERE question = 'Who wrote: "The mind is not a vessel to be filled, but a fire to be kindled"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Patrick Henry"},{"id":"b","text":"Thomas Jefferson"},{"id":"c","text":"Benjamin Franklin"},{"id":"d","text":"George Washington"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Jefferson wrote the Declaration of Independence but didn''t say this.","c":"Franklin said ''Those who would give up essential Liberty, to purchase a little temporary Safety, deserve neither.''","d":"Washington led the Continental Army but Patrick Henry made this speech."}'
WHERE question = 'Who said: "Give me liberty, or give me death!"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Ayn Rand"},{"id":"b","text":"Friedrich Hayek"},{"id":"c","text":"Milton Friedman"},{"id":"d","text":"Ludwig von Mises"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Hayek defended individual liberty but this specific quote is Rand''s.","c":"Friedman advocated free markets but didn''t coin this phrase.","d":"Mises focused on economic individualism but this is Rand''s formulation."}'
WHERE question = 'Who wrote: "The smallest minority on earth is the individual"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Thomas Paine"},{"id":"b","text":"Voltaire"},{"id":"c","text":"Evelyn Beatrice Hall"},{"id":"d","text":"John Stuart Mill"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Paine defended liberty in ''Common Sense'' but didn''t write this line.","b":"Voltaire championed free speech, but Hall wrote this summary of his views.","d":"Mill wrote ''On Liberty'' defending free expression but not this exact quote."}'
WHERE question = 'Who said: "I disapprove of what you say, but I will defend to the death your right to say it"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Ayn Rand"},{"id":"b","text":"Paul Krugman"},{"id":"c","text":"Christopher Hitchens"},{"id":"d","text":"William F. Buckley"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Rand wrote Atlas Shrugged but not this quote about it.","c":"Hitchens was a contrarian intellectual but didn''t write this.","d":"Buckley was a conservative commentator who had debates with Rand."}'
WHERE question = 'Who wrote: "There are two novels that can change a bookish fourteen-year old''s life: The Lord of the Rings and Atlas Shrugged"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Arthur Schopenhauer"},{"id":"b","text":"Carl Jung"},{"id":"c","text":"Friedrich Nietzsche"},{"id":"d","text":"Sigmund Freud"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Schopenhauer influenced Nietzsche but this is from Beyond Good and Evil.","b":"Jung studied the shadow self but this quote is Nietzsche''s.","d":"Freud focused on the unconscious but didn''t write this."}'
WHERE question = 'Who wrote: "He who fights with monsters should look to it that he himself does not become a monster"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Henry David Thoreau"},{"id":"b","text":"Thomas Paine"},{"id":"c","text":"John O''Sullivan"},{"id":"d","text":"Thomas Jefferson"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Thoreau quoted this but attributed it to ''that government is best which governs least''.","b":"Paine critiqued government but this specific phrase is O''Sullivan''s.","d":"Jefferson held similar views but didn''t coin this phrase."}'
WHERE question = 'Who said: "The government that governs best, governs least"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Samuel Johnson"},{"id":"b","text":"John Milton"},{"id":"c","text":"Saint Bernard of Clairvaux"},{"id":"d","text":"Karl Marx"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Johnson said ''Hell is paved with good intentions'' but Bernard originated the concept.","b":"Milton wrote Paradise Lost but not this proverb.","d":"Marx had many bad intentions AND bad results."}'
WHERE question = 'Who wrote: "The road to hell is paved with good intentions"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Everything is relative to the observer"},{"id":"b","text":"Reality is created by consciousness"},{"id":"c","text":"Truth depends on cultural context"},{"id":"d","text":"Things are what they are, regardless of what anyone thinks"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Relativism contradicts the Law of Identity by denying objective reality.","b":"The primacy of consciousness is the opposite error—reality exists independent of awareness.","c":"Cultural relativism is a form of subjectivism that denies objective truth."}'
WHERE question = 'What does the Law of Identity (A is A) establish?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Reality exists independent of consciousness"},{"id":"b","text":"Consciousness creates reality"},{"id":"c","text":"Nothing can be known about reality"},{"id":"d","text":"Existence and consciousness are equal"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"This is the ''primacy of consciousness'' fallacy—the idea that wishing makes it so.","c":"This is skepticism, which contradicts itself (claiming to know that nothing can be known).","d":"Existence is primary; consciousness is dependent on existence to have something to be conscious OF."}'
WHERE question = 'What is the "primacy of existence" in philosophy?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Nature is an illusion created by language"},{"id":"b","text":"Things have no fixed nature"},{"id":"c","text":"A thing can only act according to its nature"},{"id":"d","text":"A thing can act against its nature through willpower"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"This is a postmodernist view that Aristotle would reject as self-refuting.","b":"Denying fixed natures denies identity itself, which is self-contradictory.","d":"Actions against one''s nature are impossible—you can only act within the possibilities your nature allows."}'
WHERE question = 'According to Aristotle, what is the relationship between a thing and its nature?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It''s only true for some people"},{"id":"b","text":"It''s true but impractical"},{"id":"c","text":"It reverses the relationship between consciousness and existence"},{"id":"d","text":"It''s not an error—belief shapes reality"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Truth isn''t selective—the laws of reality apply to everyone equally.","b":"It''s not impractical—it''s impossible. Contradictions cannot exist.","d":"If belief shaped reality, you could believe yourself into flying. Reality''s independence is proven by the existence of error."}'
WHERE question = 'What is the philosophical error in saying "reality is whatever you believe it to be"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Existence is the most fundamental fact but still requires philosophical justification"},{"id":"b","text":"The statement is a tautology with no real philosophical content"},{"id":"c","text":"Existence is a concept humans impose on raw sensory experience"},{"id":"d","text":"Existence is self-evident and requires no proof"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Any attempt to justify existence presupposes existence — axioms are starting points, not conclusions.","b":"Axioms are not empty tautologies — they identify irreducible facts that ground all further knowledge.","c":"This reverses the relationship: existence is primary, concepts identify what already exists."}'
WHERE question = 'What does "existence exists" mean as an axiom?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Logical deduction from self-evident first principles alone"},{"id":"b","text":"Reason applied to sensory evidence"},{"id":"c","text":"Intuition refined through years of experience"},{"id":"d","text":"Empirical observation and scientific consensus"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Pure deduction without sensory input (rationalism) cannot ground knowledge in reality — both reason and evidence are needed.","c":"Intuition can be a useful heuristic but it''s not self-validating — it requires rational verification.","d":"Consensus is not a method of cognition — scientific consensus can be wrong. Reason, not agreement, validates knowledge."}'
WHERE question = 'What is the only valid means of gaining knowledge according to rational philosophy?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"A mental image or prototype representing a typical example"},{"id":"b","text":"A linguistic label arbitrarily assigned to a group of objects"},{"id":"c","text":"An innate category of understanding that structures experience"},{"id":"d","text":"A mental integration of similar things by their essential characteristics"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Prototype theory captures part of concept use but misses the essential characteristics that define the concept.","b":"Concepts are not arbitrary labels — they identify real similarities in reality through abstraction.","c":"Kantian categories assume innate structures, but concepts are formed through experience and abstraction."}'
WHERE question = 'What is a concept in epistemology?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Trusting your own judgment"},{"id":"b","text":"Using logic to evaluate claims"},{"id":"c","text":"Questioning expert opinions"},{"id":"d","text":"Accepting a claim because an authority figure said it"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Trusting your reasoned judgment is proper—it''s blindly trusting others that''s the fallacy.","b":"Using logic is the proper method, the opposite of this fallacy.","c":"Questioning experts is actually the antidote to this fallacy—think for yourself."}'
WHERE question = 'What is the fallacy of "appeal to authority"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"A priori is emotional; a posteriori is logical"},{"id":"b","text":"A priori is uncertain; a posteriori is certain"},{"id":"c","text":"A priori is gained by reason alone; a posteriori requires experience"},{"id":"d","text":"They are the same thing"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Neither is emotional—both are cognitive methods. A priori is purely rational.","b":"Both can be certain when properly validated. Mathematical truths are a priori and certain.","d":"They describe different methods of gaining knowledge—reason alone vs. experience."}'
WHERE question = 'What is the difference between a priori and a posteriori knowledge?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It sounds sophisticated"},{"id":"b","text":"It''s agreed upon by most people"},{"id":"c","text":"It identifies the essential characteristics that distinguish a concept"},{"id":"d","text":"It''s approved by authorities"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Sophistication is irrelevant. Clarity and accuracy matter.","b":"Popularity doesn''t determine validity. Most people once believed the earth was flat.","d":"Authority doesn''t determine truth. Definitions must correspond to reality."}'
WHERE question = 'What makes a definition "valid" in logic?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Self-sacrifice for others"},{"id":"b","text":"Human life and happiness"},{"id":"c","text":"Obedience to authority"},{"id":"d","text":"What society approves of"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Self-sacrifice as a standard is a contradiction: it makes death (the sacrifice of values) the goal of life.","c":"Obedience to authority requires a standard to judge whether the authority is right or wrong.","d":"Society has often approved of slavery, human sacrifice, and genocide. Social approval cannot be the standard."}'
WHERE question = 'What is the proper standard of moral value according to rational ethics?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Heroes succeed; martyrs fail"},{"id":"b","text":"There is no difference"},{"id":"c","text":"Heroes act from reason and self-interest; martyrs sacrifice themselves for faith"},{"id":"d","text":"Martyrs are more moral than heroes"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Success vs. failure misses the essential distinction about motivation and values.","b":"The distinction is fundamental to understanding morality vs. self-destruction.","d":"Martyrdom as an ideal glorifies death over life—the opposite of proper morality."}'
WHERE question = 'What is the difference between a "hero" and a "martyr" in moral terms?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Working hard for goals"},{"id":"b","text":"Any trade-off between values"},{"id":"c","text":"Helping others"},{"id":"d","text":"Giving up a greater value for a lesser value"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Working hard for YOUR goals is self-investment, the opposite of sacrifice.","b":"Not all trade-offs are sacrifices. Trading $5 for food worth more to you than $5 is a gain.","c":"Helping people you value is not sacrifice—you gain from their wellbeing."}'
WHERE question = 'What is "sacrifice" in proper ethical terms?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Give without expecting anything in return"},{"id":"b","text":"Exchange value for value with mutual benefit"},{"id":"c","text":"Always seek to profit at others'' expense"},{"id":"d","text":"Take whatever you can get"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Giving without receiving is self-sacrifice, which treats yourself as worthless.","c":"Profit at others'' expense is parasitism, not trading. True profit creates value for both parties.","d":"Taking whatever you can get is theft or mooching—the opposite of honest trade."}'
WHERE question = 'What is the "trader principle" in ethics?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Because lying helps you get ahead"},{"id":"b","text":"Because God commands honesty"},{"id":"c","text":"Because reality cannot be faked, and your life depends on dealing with reality"},{"id":"d","text":"Because honesty makes others like you"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Lying creates a false reality in your mind while real reality continues unchanged—this is self-destructive.","b":"Divine command ethics cannot explain WHY honesty is good—only that someone orders it.","d":"While honesty does earn trust, its primary value is epistemic: keeping your mind clear."}'
WHERE question = 'Why is honesty a selfish virtue (in the proper sense)?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Rationality, Independence, Integrity, Honesty, Justice, Productiveness, Pride"},{"id":"b","text":"Faith, Hope, Charity, Prudence, Justice, Fortitude, Temperance"},{"id":"c","text":"Humility, Obedience, Chastity, Poverty"},{"id":"d","text":"Courage, Wisdom, Temperance, Justice"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"These are Christian theological virtues, mixing faith-based and rational elements.","c":"These are monastic ''virtues'' that actually negate human life and happiness.","d":"These are the four cardinal virtues from Plato—important but incomplete."}'
WHERE question = 'What are the seven objective virtues according to Objectivist ethics?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Being physically isolated"},{"id":"b","text":"Relying on your own judgment and effort as primary"},{"id":"c","text":"Rejecting all help from others"},{"id":"d","text":"Never cooperating with others"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Physical isolation is not the point—mental independence in a social context is.","c":"Accepting help voluntarily offered is fine; dependence is relying on others as your PRIMARY means.","d":"Cooperation based on mutual benefit is rational—independence refers to judgment, not isolation."}'
WHERE question = 'What is the virtue of "Independence" in ethics?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Agreeing with the majority"},{"id":"b","text":"Loyalty to your rational convictions in action"},{"id":"c","text":"Keeping secrets"},{"id":"d","text":"Following rules without question"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Agreeing with the majority is conformity. Integrity often requires standing against the crowd.","c":"Keeping secrets may or may not be relevant to integrity—it depends on the context.","d":"Following rules without question is obedience, not integrity—you must understand WHY the rules are right."}'
WHERE question = 'What is the virtue of "Integrity"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Arrogance and boasting"},{"id":"b","text":"Thinking you''re better than others"},{"id":"c","text":"Refusing to admit mistakes"},{"id":"d","text":"Moral ambitiousness—commitment to achieving your highest potential"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Arrogance is unearned self-importance. Proper pride is earned through achievement.","b":"Pride is about YOUR standards for yourself, not comparison to others.","c":"Refusing to admit mistakes is denial, not pride. Real pride requires honesty about errors to correct them."}'
WHERE question = 'What is the virtue of "Pride" in its proper moral sense?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Because making money is the highest goal"},{"id":"b","text":"Because idleness is sinful"},{"id":"c","text":"Because creating values sustains your life and gives it meaning"},{"id":"d","text":"Because society needs workers"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Money is a tool, not the goal. The goal is creating real values—products, services, art.","b":"''Sin'' is a religious concept. Productiveness is good because it serves YOUR life.","d":"Society''s needs don''t determine YOUR virtue. You produce for YOUR life and values."}'
WHERE question = 'Why is "Productiveness" a moral virtue, not just an economic activity?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"To provide essential services that markets cannot"},{"id":"b","text":"To promote the general welfare as democratically determined"},{"id":"c","text":"To ensure economic equality among citizens"},{"id":"d","text":"To protect individual rights"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"The \"market failure\" argument expands government without principled limits, leading to rights violations.","b":"Democratically determined welfare can justify any violation of rights if the majority wills it.","c":"Enforcing economic equality requires violating property rights — taking from some to give to others by force."}'
WHERE question = 'What is the only proper function of government?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"A moral principle defining freedom of action in a social context"},{"id":"b","text":"What the majority decides"},{"id":"c","text":"A guarantee of material goods"},{"id":"d","text":"A permission granted by government"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Rights protect individuals FROM the majority. Democracy cannot vote away your rights.","c":"Rights are to freedom of ACTION, not guaranteed outcomes. No one owes you goods.","d":"If government grants rights, it can revoke them—making ''rights'' mere permissions. True rights precede government."}'
WHERE question = 'What is an "individual right"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Let the government handle all force"},{"id":"b","text":"Never initiate force; use it only in retaliation against those who initiate it"},{"id":"c","text":"Force is always justified if you need something"},{"id":"d","text":"Never use force under any circumstances"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Government should have a monopoly on retaliatory force, but the principle applies to everyone.","c":"Need does not justify force. Needing something doesn''t give you the right to take it by force.","d":"Pacifism is self-destructive. Self-defense against aggressors is moral and necessary."}'
WHERE question = 'What is the "non-initiation of force" principle?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Because it''s based on voluntary trade and individual rights"},{"id":"b","text":"Because mixed economies with some regulation perform better than pure systems"},{"id":"c","text":"Because it produces the most material wealth for the greatest number"},{"id":"d","text":"Because democratic socialism preserves freedom while reducing inequality"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Mixed economies violate rights through forced redistribution — the moral principle is consent, not pragmatism.","c":"Wealth production is a consequence, not the moral foundation. Capitalism is moral because it respects rights.","d":"Democratic socialism still forces redistribution by majority vote, violating individual rights."}'
WHERE question = 'Why is capitalism the only moral economic system?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Positive rights require others to provide; negative rights require others to refrain"},{"id":"b","text":"Positive rights are constitutional; negative rights are not"},{"id":"c","text":"They are the same thing"},{"id":"d","text":"Positive rights are good; negative rights are bad"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"The Constitution originally protected negative rights; positive ''rights'' were added later through misinterpretation.","c":"They are opposites: one demands action FROM others; one demands non-interference.","d":"Negative rights are the only genuine rights. ''Positive rights'' are actually claims on others'' labor."}'
WHERE question = 'What is the difference between "positive rights" and "negative rights"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"The unintended social benefits from individuals pursuing self-interest"},{"id":"b","text":"Government secretly controlling markets"},{"id":"c","text":"Corporate manipulation of consumers"},{"id":"d","text":"Divine intervention in commerce"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"The invisible hand is the ABSENCE of government control, not secret control.","c":"In free markets, consumers control producers through their choices—not vice versa.","d":"It''s a metaphor for emergent order from voluntary exchange, not supernatural intervention."}'
WHERE question = 'What is the "invisible hand" in economics?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"When profits from a transaction are divided equally between buyer and seller"},{"id":"b","text":"When government mediates to ensure a fair outcome for both sides"},{"id":"c","text":"When both parties gain value through voluntary exchange"},{"id":"d","text":"When both parties compromise equally on price"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Equal profit division is irrelevant. Both parties gain according to their OWN values, not equal amounts.","b":"Voluntary exchange achieves mutual benefit without government intervention — mediation adds cost without necessity.","d":"Compromise on price is negotiation mechanics — the win comes from each party valuing what they receive more than what they give."}'
WHERE question = 'What is a "win-win" transaction?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"They fail because greedy landlords evade them"},{"id":"b","text":"They don''t fail—they help the poor"},{"id":"c","text":"They only fail when set too low"},{"id":"d","text":"They create shortages by eliminating profit incentive to supply"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Landlords respond rationally to incentives. Blaming ''greed'' ignores economic laws.","b":"Rent control hurts the very people it claims to help by reducing housing supply.","c":"ANY price below market equilibrium causes shortage; ANY price above causes surplus."}'
WHERE question = 'Why do price controls (like rent control) fail?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"That rebuilding after wars stimulates long-term economic growth"},{"id":"b","text":"That destruction creates economic benefit by creating work"},{"id":"c","text":"That visible economic activity always represents genuine wealth creation"},{"id":"d","text":"That disaster relief spending boosts GDP and helps the economy"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Post-war rebuilding is a common application of the fallacy, but not the fallacy itself.","c":"This captures part of the error but the fallacy specifically concerns destruction being seen as beneficial.","d":"While related, this describes a specific application rather than the core fallacy Bastiat identified."}'
WHERE question = 'What is the "broken window fallacy"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It established a nation based on individual rights, not group or divine right"},{"id":"b","text":"It overthrew monarchy for socialism"},{"id":"c","text":"It created a democracy"},{"id":"d","text":"It was the first revolution"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"The Founders championed limited government and property rights—the opposite of socialism.","c":"America is a constitutional republic that protects rights FROM democracy (majority rule).","d":"Many revolutions preceded it. Its uniqueness was the philosophical basis."}'
WHERE question = 'Why was the American Revolution philosophically significant?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Following the American model too closely"},{"id":"b","text":"Rousseau''s ''general will'' sacrificing individuals to the collective"},{"id":"c","text":"Too much individual liberty"},{"id":"d","text":"Excessive protection of property rights"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"The French explicitly REJECTED the American model of individual rights.","c":"Individual liberty was precisely what was LACKING. The Terror sacrificed individuals to the ''nation.''","d":"Property was confiscated wholesale. Protection of property rights might have prevented the Terror."}'
WHERE question = 'What philosophical error led to the French Revolution''s Reign of Terror?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It prevented a Soviet invasion"},{"id":"b","text":"It didn''t—it was purely destructive"},{"id":"c","text":"Japan was about to surrender anyway"},{"id":"d","text":"The alternative invasion would have killed millions of Americans and Japanese"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"While a factor, the primary calculation was American and Japanese lives saved vs. invasion.","b":"War is destructive, but the alternative was MORE destruction through prolonged invasion.","c":"Japan''s military rejected surrender even AFTER the first bomb. They planned to fight to the last."}'
WHERE question = 'Why did the atomic bombing of Japan actually save lives?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Collectivism—ideologies that sacrificed individuals to groups"},{"id":"b","text":"Capitalism''s excesses"},{"id":"c","text":"Technology—better weapons enabled more killing"},{"id":"d","text":"Religious extremism"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"The worst atrocities occurred in anti-capitalist regimes (USSR, China, Cambodia).","c":"Technology was the means, not the cause. The same technology didn''t cause mass murder in free countries.","d":"While some religious violence occurred, the mega-deaths were from secular collectivist ideologies."}'
WHERE question = 'What was the philosophical cause of the 20th century''s unprecedented mass murders?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"That communism was only bad because of Stalin"},{"id":"b","text":"That collectivism and central planning cannot sustain an economy or society"},{"id":"c","text":"That military defeat ended communism"},{"id":"d","text":"That socialism can work if properly implemented"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Soviet problems persisted through all leaders. The system itself was the problem.","c":"The USSR wasn''t militarily defeated—it collapsed internally from economic failure.","d":"The ''not real socialism'' argument ignores that socialism''s failures are inherent, not accidental."}'
WHERE question = 'What did the fall of the Soviet Union in 1991 demonstrate?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Its size and natural resources"},{"id":"b","text":"Its cultural diversity"},{"id":"c","text":"Its military power"},{"id":"d","text":"It was founded on the principle that individuals have rights that government cannot violate"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Many nations have resources. Ideas made America able to use them productively.","b":"Diversity exists elsewhere. The unifying IDEA of individual rights is unique.","c":"Military power is a consequence of American productivity, not its philosophical foundation."}'
WHERE question = 'What makes America philosophically unique among nations?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Rights for citizens only"},{"id":"b","text":"Rights given by the government"},{"id":"c","text":"Rights that can be taken away by law"},{"id":"d","text":"Rights inherent in human nature that cannot be legitimately removed"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Natural rights apply to all humans by virtue of their humanity, not citizenship.","b":"Government doesn''t create rights—it can only recognize or violate pre-existing rights.","c":"If rights could be taken by law, they wouldn''t be ''unalienable''—they''d be privileges."}'
WHERE question = 'What does "unalienable rights" mean in the Declaration of Independence?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Democracy wasn''t invented yet"},{"id":"b","text":"They didn''t trust the common people"},{"id":"c","text":"To protect individual rights from majority tyranny"},{"id":"d","text":"To benefit the wealthy"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Democracy dates to ancient Athens. The Founders deliberately rejected it.","b":"The issue wasn''t distrust of people but protection FROM any group—majority or minority—violating rights.","d":"Constitutional limits protect everyone''s rights, not just the wealthy''s."}'
WHERE question = 'Why did the Founders create a republic rather than a pure democracy?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Law that judges can interpret flexibly"},{"id":"b","text":"Law that is clearly defined, knowable in advance, and applies equally to all"},{"id":"c","text":"Law that changes with social conditions"},{"id":"d","text":"Law based on the ruler''s will"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Flexible interpretation makes law subjective—you can''t know if you''re complying.","c":"Law that constantly changes cannot be known in advance—making compliance impossible.","d":"Rule by the ruler''s will is the opposite: arbitrary power, not objective standards."}'
WHERE question = 'What is "objective law"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"More laws are better than fewer"},{"id":"b","text":"Even rulers are bound by law; no one is above it"},{"id":"c","text":"Lawyers should run the government"},{"id":"d","text":"Law enforcement should be strict"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"The number of laws is irrelevant. What matters is their objectivity and limits on power.","c":"Rule of law is a principle, not about who holds office.","d":"Strict enforcement of arbitrary laws is still tyranny."}'
WHERE question = 'What is the "rule of law" as opposed to "rule of men"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"There is no such thing as society"},{"id":"b","text":"''Social good'' is undefined and can justify any violation of rights"},{"id":"c","text":"Social good is more important than rights"},{"id":"d","text":"Individual rights are selfish"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Society exists as a collection of individuals—but it has no rights apart from individual rights.","c":"Sacrificing individuals to ''social good'' IS the defining crime of collectivism.","d":"Individual rights are the precondition for any genuine ''good''—for individuals or society."}'
WHERE question = 'Why must law be based on protecting individual rights rather than promoting "social good"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"To faithfully document reality as it actually exists"},{"id":"b","text":"To concretize abstract values and make them perceptible"},{"id":"c","text":"To serve as a mirror reflecting society''s collective consciousness"},{"id":"d","text":"To express the artist''s subjective emotional state"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Mere documentation is naturalism, not the full purpose of art — art selects and integrates according to values.","c":"Art reflects individual values, not a collective consciousness — there is no collective mind.","d":"Emotional expression without cognitive content produces art that communicates nothing universal."}'
WHERE question = 'What is the purpose of art according to rational aesthetics?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Whatever people like is beautiful"},{"id":"b","text":"Harmonic structure, melodic coherence, and integration of elements"},{"id":"c","text":"Commercial success"},{"id":"d","text":"Novelty and breaking rules"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Popularity doesn''t equal quality. Many people like junk food but it''s not nutritious.","c":"Commercial success measures popularity, not aesthetic merit.","d":"Breaking rules can be innovative OR just noise. Innovation must still create value."}'
WHERE question = 'What makes music "beautiful" in objective terms?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Art about romantic relationships"},{"id":"b","text":"Fantasy art without rules"},{"id":"c","text":"Strictly copying nature"},{"id":"d","text":"Art depicting the world as it could and should be, according to one''s values"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"The ''Romantic'' refers to the artistic movement emphasizing values, not romance novels.","b":"Romantic Realism is grounded in reality and rationality, not arbitrary fantasy.","c":"Mere copying (Naturalism) omits the selective, value-laden element essential to art."}'
WHERE question = 'What is "Romantic Realism" in art?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Because it''s a popular song"},{"id":"b","text":"It rejects all authority"},{"id":"c","text":"It promotes isolation from others"},{"id":"d","text":"It celebrates living by one''s own judgment and taking responsibility for choices"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Popularity doesn''t determine philosophical content.","b":"It''s not about rejecting authority but about taking ownership of your life choices.","c":"The song doesn''t advocate isolation—it advocates authenticity in how you live."}'
WHERE question = 'Why does "My Way" by Frank Sinatra embody individualist ethics?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"None—it''s a perfect philosophy"},{"id":"b","text":"Religious extremism"},{"id":"c","text":"Collectivism and the elimination of private property"},{"id":"d","text":"Excessive individualism"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"The song promotes ideas that have caused mass suffering when implemented.","b":"The song explicitly imagines ''no religion''—it''s anti-religious, not religiously extreme.","d":"The song promotes the opposite: dissolving individual identity into a collective ''brotherhood.''"}'
WHERE question = 'What philosophical error does "Imagine" by John Lennon promote?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"The music industry censors anti-capitalist messages"},{"id":"b","text":"They don''t—they make valid points"},{"id":"c","text":"Protest songs are always artistic failures"},{"id":"d","text":"Artists profit from selling music in the capitalist system they condemn"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"The opposite is true—''anti-establishment'' sells well, proving capitalism serves even its critics.","b":"The philosophical contradiction exists regardless of any other points made.","c":"Some protest songs are artistically excellent—the issue is philosophical inconsistency."}'
WHERE question = 'Why do many "protest songs" against capitalism philosophically self-refute?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It was a box office hit"},{"id":"b","text":"It dramatizes the conflict between individualism and collectivism"},{"id":"c","text":"It has impressive special effects"},{"id":"d","text":"It criticizes capitalism"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Box office success doesn''t determine philosophical significance.","c":"It''s a character-driven drama, not a special effects film.","d":"The film DEFENDS individualism and implicitly capitalism—it doesn''t criticize them."}'
WHERE question = 'Why is "The Fountainhead" (1949) philosophically significant?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Nature is more important than nurture"},{"id":"b","text":"Human will and spirit can overcome genetic limitations"},{"id":"c","text":"Genetics completely determines destiny"},{"id":"d","text":"Genetic engineering is entirely beneficial"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"The film argues the opposite: nurture (will, choices) transcends nature (genetics).","c":"The entire plot refutes genetic determinism—Vincent succeeds despite ''inferior'' genes.","d":"The film critiques a society that over-relies on genetic engineering."}'
WHERE question = 'What does the film "Gattaca" (1997) argue about human nature and determinism?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"The novel isn''t interesting"},{"id":"b","text":"The ideas are wrong"},{"id":"c","text":"Hollywood deliberately sabotaged them"},{"id":"d","text":"Philosophy requires extensive dialogue and introspection difficult to film"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"The novel has millions of passionate readers—clearly it''s interesting to many.","b":"Whether the ideas are right or wrong doesn''t explain the adaptation difficulty.","c":"The films were independently produced by supporters of the novel."}'
WHERE question = 'Why does "Atlas Shrugged" (the films) struggle to capture the novel''s ideas?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Without private ownership, shared resources are overused and destroyed"},{"id":"b","text":"The tragedy only applies to natural resources, not manufactured goods"},{"id":"c","text":"Community management of resources is more sustainable than private ownership"},{"id":"d","text":"Government regulation is the only solution to resource depletion"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"The tragedy applies wherever resources lack clear ownership — from fisheries to shared office fridges.","c":"Community management suffers from the same misaligned incentives — individuals still benefit from overuse.","d":"Government regulation is one response, but private property rights solve the problem at its root by aligning incentives."}'
WHERE question = 'How does the "tragedy of the commons" illustrate the importance of property rights?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"The controls aren''t strict enough"},{"id":"b","text":"Landlords are too greedy to comply"},{"id":"c","text":"They reduce housing supply by eliminating incentive to build or maintain"},{"id":"d","text":"They don''t fail—they provide affordable housing"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Stricter controls worsen the problem by further eliminating incentives.","b":"Landlords respond rationally to incentives—if you remove profit, they stop investing.","d":"Every major study shows rent control reduces housing supply and quality."}'
WHERE question = 'Why do rent control policies fail to help those they intend to help?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Cronyism helps small businesses"},{"id":"b","text":"Cronyism is just another word for capitalism"},{"id":"c","text":"Cronyism is business using government force; capitalism forbids initiating force"},{"id":"d","text":"Capitalism always leads to cronyism"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Cronyism helps connected businesses at the expense of smaller competitors.","b":"Cronyism requires government intervention; capitalism requires government NON-intervention.","d":"Capitalism with strictly limited government prevents cronyism by removing government favors to sell."}'
WHERE question = 'What is "cronyism" and why does it differ from capitalism?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Inflation helps savers"},{"id":"b","text":"It''s not—inflation is natural"},{"id":"c","text":"Only deflation is harmful"},{"id":"d","text":"Government printing money reduces purchasing power, transferring wealth to government"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Inflation destroys savers by reducing the value of their savings.","b":"Inflation is caused by government increasing money supply—it''s a policy choice, not nature.","c":"Both inflation and deflation can be harmful, but inflation is the more common government-caused problem."}'
WHERE question = 'Why is inflation a hidden tax?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Every benefit has a cost—someone always pays"},{"id":"b","text":"Restaurants should charge for everything"},{"id":"c","text":"Poor people don''t deserve help"},{"id":"d","text":"Generosity is wrong"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"It''s a metaphor about economics and policy, not literal restaurant advice.","c":"The principle says nothing about who deserves what—only that costs exist.","d":"Voluntary generosity is fine—the point is that SOMEONE pays, even for gifts."}'
WHERE question = 'What does "there''s no such thing as a free lunch" mean philosophically?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Using words without defining them"},{"id":"b","text":"Copying someone else''s ideas"},{"id":"c","text":"Using a concept while denying the concepts on which it depends"},{"id":"d","text":"Using technical jargon to confuse"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Vagueness is a different problem. Stolen concept is more specific.","b":"That would be plagiarism, not a logical fallacy.","d":"Obfuscation is a rhetorical tactic, not this specific fallacy."}'
WHERE question = 'What is the "stolen concept" fallacy?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Treating concrete things as abstract"},{"id":"b","text":"Treating an abstraction as if it were a concrete entity with causal powers"},{"id":"c","text":"Using too many abstract concepts"},{"id":"d","text":"Failing to abstract from concretes"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"That would be the opposite error.","c":"Using abstractions is proper; treating them as concrete entities is the error.","d":"Failure to abstract is an epistemological weakness, not this specific fallacy."}'
WHERE question = 'What is the "fallacy of reification" (or hypostatization)?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"The claim that people always act selfishly, which is unfalsifiable"},{"id":"b","text":"A correct description of human nature"},{"id":"c","text":"The opposite of ethical egoism"},{"id":"d","text":"The view that people should be selfish"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Being unfalsifiable means it''s not a testable scientific claim.","c":"They''re related but different: one describes, one prescribes.","d":"That''s ethical egoism (a normative claim), not psychological egoism (a descriptive claim)."}'
WHERE question = 'What is "psychological egoism" and why is it false?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Trusting democratic processes"},{"id":"b","text":"Assuming central planners can possess the dispersed knowledge needed to run an economy"},{"id":"c","text":"Believing in individual rights"},{"id":"d","text":"Supporting free markets"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Democracy is separate from economic planning.","c":"Hayek defended individual rights—that''s not the conceit.","d":"Hayek championed free markets against the fatal conceit of planning."}'
WHERE question = 'What is the "fatal conceit" according to F.A. Hayek?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Too much capitalism"},{"id":"b","text":"Article 48 allowed emergency suspension of rights, enabling dictatorship"},{"id":"c","text":"Not enough democratic participation"},{"id":"d","text":"Too much protection of individual rights"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Weimar Germany had extensive government intervention, not laissez-faire capitalism.","c":"Germany had extensive democracy—the problem was inadequate constitutional limits.","d":"The problem was that rights COULD be suspended, not that they were too protected."}'
WHERE question = 'What philosophical error did the Weimar Republic''s constitution make that enabled Hitler?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"When regulated industries control the agencies meant to regulate them"},{"id":"b","text":"When government captures private businesses"},{"id":"c","text":"When regulations are properly enforced"},{"id":"d","text":"When regulations become too strict"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Capture is subtler: the industry controls the regulator without formal ownership.","c":"Captured regulations are enforced to benefit the industry, not the public.","d":"Strictness isn''t the issue—it''s WHO benefits from the regulations."}'
WHERE question = 'What is "regulatory capture"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Karl Marx"},{"id":"b","text":"John Maynard Keynes"},{"id":"c","text":"Adam Smith"},{"id":"d","text":"Milton Friedman"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Marx focused on historical inevitability, not dismissing the long run.","c":"Smith was concerned with long-term wealth creation, not dismissing the future.","d":"Friedman criticized this attitude and Keynesian economics generally."}'
WHERE question = 'Who wrote: "In the long run we are all dead"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Employers are too greedy to pay fair wages"},{"id":"b","text":"The minimum wage is always set too high"},{"id":"c","text":"If a worker produces less value than the minimum wage, hiring them is a loss"},{"id":"d","text":"They don''t—minimum wage only helps workers"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"''Greed'' doesn''t explain economics. Businesses can''t sustainably pay more than workers produce.","b":"ANY minimum wage above market equilibrium causes some unemployment—it''s the principle.","d":"Basic economics and empirical studies show minimum wage increases unemployment among low-skilled workers."}'
WHERE question = 'Why do minimum wage laws cause unemployment among the least skilled?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Justice is about punishing enemies"},{"id":"b","text":"Judging others objectively protects you from frauds and helps you find value"},{"id":"c","text":"Justice means getting more than others"},{"id":"d","text":"Justice is actually selfless, not selfish"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Justice includes rewarding the good, not just punishing the bad.","c":"Justice is about accurate evaluation, not gaining advantage through judgment.","d":"All genuine virtues are selfish in the proper sense—they serve your life."}'
WHERE question = 'Why is "justice" a selfish virtue?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"You can never derive ought from is"},{"id":"b","text":"The problem has no solution"},{"id":"c","text":"Facts and values are completely separate"},{"id":"d","text":"Recognizing that ''ought'' depends on ''is''—specifically, on what human life requires"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"You CAN derive ought from is once you identify life as the standard of value.","b":"Identifying life as the standard resolves the problem.","c":"Facts about life requirements determine values—they''re not separate."}'
WHERE question = 'What is the "is-ought problem" and how is it resolved?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It proves circular reasoning is valid"},{"id":"b","text":"It supports infinite regress of justification"},{"id":"c","text":"It shows that foundations of knowledge must be axiomatic, not derived"},{"id":"d","text":"It proves knowledge is impossible"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Circular reasoning is another horn—also not a solution. Axioms are the answer.","b":"Infinite regress is one horn of the trilemma, not a solution.","d":"The trilemma doesn''t prove impossibility—it identifies the need for axioms."}'
WHERE question = 'What is the "Münchhausen trilemma" and how does Objectivism address it?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It proposes competing private defense agencies, but this enables force initiation without objective resolution"},{"id":"b","text":"Objectivists support anarcho-capitalism"},{"id":"c","text":"It''s the same as Objectivism"},{"id":"d","text":"It has too much government"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Rand explicitly criticized anarchism as ''naive'' and ''floating abstraction.''","c":"Objectivism supports limited government, not no government.","d":"Anarcho-capitalism has NO government—that''s the issue."}'
WHERE question = 'What is "anarcho-capitalism" and why do Objectivists reject it?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"To support the military"},{"id":"b","text":"To ensure the people could resist tyrannical government"},{"id":"c","text":"For hunting rights"},{"id":"d","text":"For sport shooting"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"The militia clause refers to citizen soldiers, not professional military.","c":"Hunting rights were so obvious they needed no amendment. The purpose was political.","d":"Sport shooting wasn''t the Founders'' concern in creating constitutional protections."}'
WHERE question = 'Why did the American Founders include the Second Amendment?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Explicit philosophy is irrelevant to art"},{"id":"b","text":"Sense of life is an emotional sum of subconscious value-responses; philosophy is explicit conceptual beliefs"},{"id":"c","text":"They are the same thing"},{"id":"d","text":"Sense of life is more important"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Explicit philosophy is essential for evaluating art, even if sense of life shapes initial response.","c":"They often align but can conflict—someone may profess pessimism yet respond to heroic art.","d":"Both matter: sense of life shapes response; philosophy enables evaluation."}'
WHERE question = 'What is the difference between "sense of life" and explicit philosophy in art?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Abraham Lincoln"},{"id":"b","text":"John Adams"},{"id":"c","text":"Henry David Thoreau"},{"id":"d","text":"Thomas Jefferson"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Lincoln expanded federal power during the Civil War.","b":"Adams was more in favor of strong federal government.","d":"Jefferson held similar views but didn''t write this specific quote."}'
WHERE question = 'Who said: "That government is best which governs least"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Plato"},{"id":"b","text":"Aristotle"},{"id":"c","text":"Epicurus"},{"id":"d","text":"Socrates"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Plato recorded it, but Socrates spoke these words.","b":"Aristotle was Plato''s student, coming after Socrates.","c":"Epicurus focused on pleasure and avoiding pain."}'
WHERE question = 'Who wrote: "The unexamined life is not worth living"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Lord Acton"},{"id":"b","text":"Edmund Burke"},{"id":"c","text":"John Stuart Mill"},{"id":"d","text":"Thomas Jefferson"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Burke was concerned with tradition and order.","c":"Mill focused on liberty and utilitarianism.","d":"Jefferson warned about power but didn''t coin this phrase."}'
WHERE question = 'Who said: "Power tends to corrupt, and absolute power corrupts absolutely"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Aristotle"},{"id":"b","text":"Karl Marx"},{"id":"c","text":"Adam Smith"},{"id":"d","text":"The Bible (1 Timothy)"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Aristotle wrote about money but not this specific phrase.","b":"Marx critiqued capitalism but this quote predates him by millennia.","c":"Smith analyzed money''s role in economics positively."}'
WHERE question = 'Who wrote: "The love of money is the root of all evil"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Karl Marx"},{"id":"b","text":"Vladimir Lenin"},{"id":"c","text":"Leon Trotsky"},{"id":"d","text":"Friedrich Engels"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Lenin implemented Marx''s ideas but didn''t write the Manifesto.","c":"Trotsky came later, during the Russian Revolution.","d":"Engels co-wrote it but Marx is primarily credited."}'
WHERE question = 'Who said: "Workers of the world, unite! You have nothing to lose but your chains"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Simone de Beauvoir"},{"id":"b","text":"Albert Camus"},{"id":"c","text":"Martin Heidegger"},{"id":"d","text":"Jean-Paul Sartre"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"De Beauvoir was Sartre''s partner and fellow existentialist.","b":"Camus was an existentialist but focused on absurdity.","c":"Heidegger influenced existentialism but didn''t use this phrase."}'
WHERE question = 'Who wrote: "Man is condemned to be free"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Charles Darwin"},{"id":"b","text":"Sigmund Freud"},{"id":"c","text":"Friedrich Nietzsche"},{"id":"d","text":"Richard Dawkins"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Darwin''s evolution challenged creation accounts but he didn''t make this philosophical declaration.","b":"Freud analyzed religion psychologically but didn''t use this phrase.","d":"Dawkins is a modern atheist who came much later."}'
WHERE question = 'Who wrote: "God is dead"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Confucius"},{"id":"b","text":"Plato"},{"id":"c","text":"Socrates"},{"id":"d","text":"Aristotle"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Confucius focused on social harmony and ritual.","b":"Plato developed the theory of Forms but this is Socratic.","d":"Aristotle balanced intellectual and moral virtues differently."}'
WHERE question = 'Who said: "The only good is knowledge and the only evil is ignorance"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"David Ricardo"},{"id":"b","text":"Adam Smith"},{"id":"c","text":"Thomas Malthus"},{"id":"d","text":"John Locke"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Ricardo developed comparative advantage but this is Smith.","c":"Malthus wrote about population, not market exchange.","d":"Locke focused on natural rights and property."}'
WHERE question = 'Who wrote: "It is not from the benevolence of the butcher, the brewer, or the baker that we expect our dinner"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Friedrich Engels"},{"id":"b","text":"Karl Marx"},{"id":"c","text":"Georg Hegel"},{"id":"d","text":"Vladimir Lenin"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Engels was Marx''s collaborator but this is from Marx''s solo work.","c":"Hegel was Marx''s philosophical influence but didn''t write this.","d":"Lenin applied Marx''s ideas later."}'
WHERE question = 'Who said: "The philosophers have only interpreted the world; the point is to change it"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"John Locke"},{"id":"b","text":"George Berkeley"},{"id":"c","text":"Immanuel Kant"},{"id":"d","text":"David Hume"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Locke was an empiricist who believed in external reality.","c":"Kant posited things-in-themselves existing beyond perception.","d":"Hume was a skeptic but didn''t deny external existence this extremely."}'
WHERE question = 'Who wrote: "To be is to be perceived"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Hedonism"},{"id":"b","text":"Indifference"},{"id":"c","text":"Cruelty"},{"id":"d","text":"Rational self-interest"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Hedonism seeks pleasure regardless of consequences—not rational self-interest.","b":"Indifference isn''t a moral position—it''s absence of valuation.","c":"Cruelty is harming others for its own sake—neither altruistic nor properly selfish."}'
WHERE question = 'What is the opposite of "altruism" in ethics?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Duty without connection to your values is obedience to arbitrary commands"},{"id":"b","text":"Duty is the highest virtue"},{"id":"c","text":"Duty is always valid"},{"id":"d","text":"All duty is religious"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Acting from duty alone ignores why you should act. Purpose comes first.","c":"Duty needs a purpose—serving your life. Purposeless duty is blind obedience.","d":"Secular duty ethics exist (Kant) but share the same problem."}'
WHERE question = 'Why is "duty" an invalid moral concept when divorced from values?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"The view that moral disagreement proves no culture''s morality is superior"},{"id":"b","text":"The claim that individuals, not cultures, determine moral truth"},{"id":"c","text":"The view that moral truths are objective and universal across cultures"},{"id":"d","text":"The claim that morality varies by culture, which is itself a universal moral claim"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Disagreement doesn''t prove absence of truth — people disagree about science too without negating facts.","b":"That describes moral subjectivism (individual-level), not cultural relativism.","c":"That''s moral objectivism, the opposite of relativism."}'
WHERE question = 'What is "moral relativism" and why is it self-refuting?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Intrinsic value exists regardless of any valuer; objective value exists in relation to a valuer''s life"},{"id":"b","text":"They are the same"},{"id":"c","text":"Intrinsic is subjective"},{"id":"d","text":"Objective is arbitrary"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"The distinction is crucial. Intrinsic value has no rational basis; objective value does.","c":"Intrinsic value is supposed to be objective-without-a-subject, which is incoherent.","d":"Objective value is grounded in the requirements of life—not arbitrary."}'
WHERE question = 'What is the difference between "intrinsic" and "objective" value?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Outcomes we don''t control affect moral judgments of identical actions"},{"id":"b","text":"Luck determines morality"},{"id":"c","text":"Morality is random"},{"id":"d","text":"Lucky people are more moral"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Luck doesn''t determine morality, but it affects our judgments—that''s the puzzle.","c":"Morality isn''t random, but the outcomes we judge ARE affected by randomness.","d":"The point isn''t about lucky people being moral but about judging actions vs. outcomes."}'
WHERE question = 'What is "moral luck" and why does it challenge common moral intuitions?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Using logic in ethics"},{"id":"b","text":"Studying ethics scientifically"},{"id":"c","text":"Defining ''good'' in terms of natural properties like pleasure or survival"},{"id":"d","text":"Believing nature exists"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Logic is essential to ethics—not a fallacy.","b":"Scientific study of ethics is metaethics, not a fallacy.","d":"Believing in nature is metaphysics, not ethics."}'
WHERE question = 'What is the "naturalistic fallacy" according to G.E. Moore?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"The view that the laws of nature are probabilistic, not fixed"},{"id":"b","text":"The view that humans possess free will and moral responsibility"},{"id":"c","text":"The view that only some events are caused while others are random"},{"id":"d","text":"The view that all events are necessitated by prior causes"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"This describes quantum indeterminacy. Determinism holds that causation is strict and complete.","b":"That''s libertarian free will, the opposite of determinism.","c":"This describes indeterminism or compatibilist views, not strict determinism which holds ALL events are necessitated."}'
WHERE question = 'What is "determinism" in philosophy?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Only the body exists"},{"id":"b","text":"Mind and body are two separate substances"},{"id":"c","text":"Mind and body are the same thing"},{"id":"d","text":"Only the mind exists"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"That''s eliminative materialism—denying mental states exist.","c":"That would be monism or identity theory.","d":"That''s idealism—Berkeley''s view."}'
WHERE question = 'What is "dualism" regarding mind and body?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Whether truth is universal"},{"id":"b","text":"Whether morality is universal"},{"id":"c","text":"What makes multiple things the same kind (e.g., what makes all chairs ''chairs'')"},{"id":"d","text":"Whether language is universal"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Universal truth is epistemology, not this specific problem.","b":"Moral universality is ethics.","d":"Language universality is a different question."}'
WHERE question = 'What is the "problem of universals"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Complex properties arise from simpler components in ways not predictable from them"},{"id":"b","text":"The mind controls the brain"},{"id":"c","text":"Minds emerge from nothing"},{"id":"d","text":"Consciousness is an illusion"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"That would be dualist interactionism.","c":"Emergence requires a substrate from which properties emerge.","d":"Emergence treats consciousness as real, not illusory."}'
WHERE question = 'What is "emergence" in philosophy of mind?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"They are the same"},{"id":"b","text":"License is more freedom"},{"id":"c","text":"Liberty is freedom within rights; license is freedom to violate others'' rights"},{"id":"d","text":"Liberty is government permission"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"The distinction is fundamental to understanding proper freedom.","b":"License is not more freedom—it destroys freedom by allowing violations.","d":"Liberty precedes government; it''s not a permission."}'
WHERE question = 'What is the difference between "liberty" and "license"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Dividing government among states"},{"id":"b","text":"Dividing the economy from government"},{"id":"c","text":"Dividing government into branches so no one holds all power"},{"id":"d","text":"Separating church and state"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"That''s federalism—distribution between federal and state governments.","b":"That''s laissez-faire economics, not separation of powers.","d":"Church-state separation is a specific application of limited government."}'
WHERE question = 'What is "separation of powers" and why does it matter?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Judges reviewing their own decisions"},{"id":"b","text":"The President overriding court decisions"},{"id":"c","text":"Courts'' power to strike down laws that violate the Constitution"},{"id":"d","text":"Congress reviewing judicial appointments"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"That''s appeals process, not judicial review.","b":"The executive cannot override courts in a system of separated powers.","d":"That''s Senate confirmation, not judicial review."}'
WHERE question = 'What is "judicial review"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"They are identical concepts"},{"id":"b","text":"Democracy guarantees freedom"},{"id":"c","text":"Democracy is majority rule; freedom requires limits on what majorities can do"},{"id":"d","text":"Democracy is more important than freedom"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"A majority can vote to oppress minorities. Freedom requires limits on majority power.","b":"Unlimited democracy can vote away rights. Constitutional limits are needed.","d":"Freedom is the value; democracy is a means that must be limited."}'
WHERE question = 'Why is "democracy" not the same as "freedom"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Against the Constitution"},{"id":"b","text":"For pure democracy"},{"id":"c","text":"For ratifying the Constitution with its checks and balances"},{"id":"d","text":"For monarchy"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"The Anti-Federalists opposed the Constitution; Federalists supported it.","b":"The Founders rejected pure democracy as majority tyranny.","d":"The Founders had just rejected monarchy in the Revolution."}'
WHERE question = 'What did the Federalist Papers argue?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"The interaction determining market prices through buyers and sellers"},{"id":"b","text":"An economic model showing that scarcity only exists when markets fail"},{"id":"c","text":"A theory that prices should be set by government to reflect true costs"},{"id":"d","text":"The principle that businesses should produce whatever consumers want"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Scarcity is a fundamental condition of reality, not a market failure. Supply and demand is how markets cope with scarcity.","c":"Government price-setting distorts the natural supply and demand mechanism, causing shortages or surpluses.","d":"Businesses respond to consumer demand AND production costs — supply and demand describes the equilibrium."}'
WHERE question = 'What is "supply and demand"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Specializing in what you do relatively more efficiently, even if not absolutely"},{"id":"b","text":"Government subsidies"},{"id":"c","text":"Having more resources"},{"id":"d","text":"Being better at everything"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Subsidies distort comparative advantage.","c":"Resources matter, but comparative advantage is about relative efficiency.","d":"That''s absolute advantage. Comparative advantage applies even without being best at anything."}'
WHERE question = 'What is "comparative advantage"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"The value of the next-best alternative you gave up"},{"id":"b","text":"The sunk costs that should factor into future decisions"},{"id":"c","text":"The risk premium added to uncertain investments"},{"id":"d","text":"The total monetary expense of a decision including hidden fees"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Sunk costs are past and irrelevant to future decisions. Opportunity cost is about current alternatives.","c":"Risk premium is about uncertainty pricing, not the value of alternatives sacrificed.","d":"Monetary expense is explicit cost. Opportunity cost includes non-monetary alternatives forgone."}'
WHERE question = 'What is "opportunity cost"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Network effects make it impossible for new competitors to enter markets"},{"id":"b","text":"Large firms can always undercut smaller rivals through predatory pricing"},{"id":"c","text":"Economies of scale naturally eliminate competition in most industries"},{"id":"d","text":"Without government barriers, competition and innovation challenge dominant firms"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Network effects create advantages but not invincible ones — superior products can overcome incumbents (Facebook replaced MySpace).","b":"Predatory pricing requires selling below cost indefinitely — the predator bleeds money while competitors can return when prices rise.","c":"Scale advantages exist but also create inefficiencies — nimble competitors exploit niches larger firms miss."}'
WHERE question = 'Why do monopolies tend to form only with government help?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"When insurance or bailouts encourage risky behavior by removing consequences"},{"id":"b","text":"The ethical obligation companies have to avoid risky products"},{"id":"c","text":"The tendency for regulations to create perverse incentives"},{"id":"d","text":"When information asymmetry allows one party to exploit another"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Moral hazard is an incentive problem, not an ethical obligation — it''s about how protection changes behavior.","c":"Perverse incentives from regulation is related but distinct — moral hazard specifically concerns risk-taking when protected from consequences.","d":"That describes adverse selection, a related but different concept in information economics."}'
WHERE question = 'What is "moral hazard" in economics?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Overproduction crises are inevitable in free markets"},{"id":"b","text":"Government stimulus is needed to maintain full employment"},{"id":"c","text":"Demand creates its own supply through consumer spending"},{"id":"d","text":"Production (supply) creates the means to purchase (demand)"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Say''s Law argues general overproduction is impossible since production creates purchasing power.","b":"Say''s Law implies markets self-correct; government stimulus reflects Keynesian rejection of Say.","c":"That''s the Keynesian reversal of Say''s Law — Keynes argued demand drives the economy."}'
WHERE question = 'What is "Say''s Law"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Emotional expression"},{"id":"b","text":"Return to ancient traditions"},{"id":"c","text":"Reason as the primary means of knowledge and progress"},{"id":"d","text":"Faith over reason"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Romanticism later emphasized emotion; Enlightenment prioritized reason.","b":"It broke from ancient traditions through rational inquiry.","d":"The Enlightenment challenged faith-based authority with reason."}'
WHERE question = 'What was the Enlightenment''s core principle?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Overpopulation"},{"id":"b","text":"Natural drought"},{"id":"c","text":"Ukrainians refused to work"},{"id":"d","text":"Seizing grain from productive farmers destroyed agricultural output"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Ukraine was the breadbasket of Europe—the problem was policy, not population.","b":"Weather was not the cause—Soviet policies created the famine.","c":"Farmers lost incentive to produce because their output was seized."}'
WHERE question = 'Why did Soviet collectivization cause the Ukrainian famine (Holodomor)?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Mao''s forced industrialization that caused 15-55 million deaths"},{"id":"b","text":"A successful modernization program"},{"id":"c","text":"A space program"},{"id":"d","text":"China''s economic reforms of the 1980s"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"It was a catastrophic failure that killed tens of millions.","c":"China''s space program came much later.","d":"Deng Xiaoping''s reforms came later and introduced market elements."}'
WHERE question = 'What was the "Great Leap Forward" and its consequences?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It established democracy"},{"id":"b","text":"It established religious freedom"},{"id":"c","text":"It abolished monarchy"},{"id":"d","text":"It limited the king''s power and established rule of law principles"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"It didn''t establish democracy but limited monarchical power.","b":"Religious freedom came later; this focused on baronial rights and due process.","c":"England remained a monarchy; the Magna Carta limited royal power."}'
WHERE question = 'What was the philosophical significance of the Magna Carta (1215)?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It enabled widespread distribution of ideas, breaking authority''s control of knowledge"},{"id":"b","text":"It employed many workers"},{"id":"c","text":"It was invented in America"},{"id":"d","text":"It made books cheaper"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Employment is an economic, not philosophical, impact.","c":"It was invented in Germany, not America.","d":"Cost reduction was the means; challenging authority was the significance."}'
WHERE question = 'Why is the printing press philosophically significant?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Socialism succeeds economically"},{"id":"b","text":"Without market prices, planners cannot rationally allocate resources"},{"id":"c","text":"It only fails due to foreign intervention"},{"id":"d","text":"It hasn''t been tried properly"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Every socialist economy has produced poverty compared to free alternatives.","c":"Internal economic failure preceded any foreign pressure in most cases.","d":"The USSR, China, Cuba, Venezuela, North Korea have all tried it—it always fails."}'
WHERE question = 'Why does socialism fail economically?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Government destroying competition"},{"id":"b","text":"Innovation replacing old industries with new, better ones"},{"id":"c","text":"Vandalism of property"},{"id":"d","text":"War stimulating the economy"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Government protection prevents creative destruction, harming progress.","c":"It''s metaphorical—old businesses ''destroyed'' by being outcompeted.","d":"War destroys capital; creative destruction reallocates it to better uses."}'
WHERE question = 'What is "creative destruction" in economics?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"They reduce incentives to produce, invest, and take risks"},{"id":"b","text":"They don''t—taxes help the economy"},{"id":"c","text":"Only taxes on the poor matter"},{"id":"d","text":"Taxes are always too low"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Economic evidence consistently shows high taxes reduce growth.","c":"Taxes on anyone reduce incentives for that person to produce.","d":"The question is what level optimizes liberty and prosperity—not whether taxes are ''enough.''"}'
WHERE question = 'Why do high taxes reduce economic growth?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"A curve showing the trade-off between inflation and unemployment"},{"id":"b","text":"The relationship showing tax revenue rises then falls as tax rates increase"},{"id":"c","text":"A graph showing that higher tax rates always produce higher revenue"},{"id":"d","text":"A model predicting optimal government spending levels"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"That describes the Phillips Curve, not the Laffer Curve.","c":"This is precisely what the Laffer Curve disproves — beyond a point, higher rates reduce revenue.","d":"The Laffer Curve concerns tax rates and revenue, not government spending optimization."}'
WHERE question = 'What is the "Laffer Curve"?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It proves government is always good"},{"id":"b","text":"It''s about voting technology"},{"id":"c","text":"It proves markets always fail"},{"id":"d","text":"It analyzes government actors as self-interested like everyone else"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"It shows government failure is systematic, not accidental.","b":"It''s about incentives in political decisions, not voting machines.","c":"It demonstrates government failure alongside market analysis."}'
WHERE question = 'Why is "public choice theory" important?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Don''t tread on me"},{"id":"b","text":"Out of many, one"},{"id":"c","text":"In God we trust"},{"id":"d","text":"Liberty and justice"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"''Don''t Tread on Me'' is from the Gadsden Flag.","c":"''In God We Trust'' became the official motto in 1956.","d":"''Liberty and justice for all'' is from the Pledge of Allegiance."}'
WHERE question = 'What does "E Pluribus Unum" mean?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It explicitly limits government power to protect pre-existing natural rights"},{"id":"b","text":"It establishes democracy"},{"id":"c","text":"It grants rights to citizens"},{"id":"d","text":"It creates the three branches"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"The main Constitution established the government structure.","c":"Rights aren''t granted by documents—they''re inherent in human nature.","d":"The Constitution''s body creates the branches; the Bill of Rights limits their power."}'
WHERE question = 'What is the significance of the Bill of Rights?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Strong central government"},{"id":"b","text":"Voluntary associations solving problems without government"},{"id":"c","text":"Religious uniformity"},{"id":"d","text":"Aristocratic traditions"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"He noted America''s decentralized, limited government as a strength.","c":"America had religious diversity but shared political principles.","d":"America rejected aristocracy in favor of equality before the law."}'
WHERE question = 'Why did de Tocqueville admire American civil society?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Naturalism is better"},{"id":"b","text":"Romanticism ignores reality"},{"id":"c","text":"They are the same"},{"id":"d","text":"Naturalism copies reality as-is; romanticism depicts reality as it could and should be"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Each has value, but romanticism adds meaning and values to observation.","b":"Romanticism is selective about reality, not disconnected from it.","c":"They represent different approaches to art''s purpose."}'
WHERE question = 'What is the difference between "naturalism" and "romanticism" in art?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"His complex sentences"},{"id":"b","text":"His ability to create larger-than-life heroes embodying values"},{"id":"c","text":"His political views"},{"id":"d","text":"His French nationality"}]',
    correct_answer = 'b',
    wrong_explanations = '{"a":"Style matters, but Rand emphasized his thematic content and heroic vision.","c":"Rand disagreed with Hugo''s socialism but admired his artistic method.","d":"Nationality is irrelevant to artistic merit."}'
WHERE question = 'Why did Ayn Rand consider Victor Hugo the greatest novelist?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Art that manipulates emotions through clichés without genuine meaning"},{"id":"b","text":"Any decorative object"},{"id":"c","text":"High-quality traditional art"},{"id":"d","text":"Modern abstract art"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Decoration can have genuine aesthetic value or be kitsch.","c":"Traditional art can be excellent or kitsch depending on execution.","d":"Abstract art may or may not be kitsch—it depends on content."}'
WHERE question = 'What is "kitsch" in aesthetic terms?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Emotion is more powerful than reason"},{"id":"b","text":"Majority rule is always right"},{"id":"c","text":"One rational person can persuade others through evidence and logic"},{"id":"d","text":"Juries should be eliminated"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"Reason ultimately overcomes the emotional reactions of several jurors.","b":"The film shows the majority was initially wrong due to prejudice and haste.","d":"It celebrates jury deliberation when done properly."}'
WHERE question = 'What does "12 Angry Men" (1957) demonstrate about reason and persuasion?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Technology in general"},{"id":"b","text":"Environmentalism"},{"id":"c","text":"Space exploration"},{"id":"d","text":"Consumerism leading to passivity and loss of human agency"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Wall-E himself is a positive portrayal of curiosity and purpose.","b":"Environmental themes exist but aren''t the deeper message.","c":"Space is the setting, not the target of critique."}'
WHERE question = 'What does "Wall-E" (2008) philosophically critique?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It shows that hope and the human spirit can overcome seemingly impossible circumstances"},{"id":"b","text":"Its twist ending"},{"id":"c","text":"Its violence"},{"id":"d","text":"Its prison setting"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"The ending reinforces the theme; it''s not mere surprise.","c":"Violence is minimal; the film is about transcending circumstance.","d":"Prison is the setting; the theme is human agency and hope."}'
WHERE question = 'Why is "The Shawshank Redemption" philosophically powerful?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"Violence in sports"},{"id":"b","text":"Aggression and dominance"},{"id":"c","text":"Fame and fortune"},{"id":"d","text":"Perseverance, self-discipline, and the will to achieve"}]',
    correct_answer = 'd',
    wrong_explanations = '{"a":"Boxing is the context; the theme is broader achievement.","b":"It''s about disciplined competition, not aggression.","c":"The goal is victory through effort, not fame."}'
WHERE question = 'What philosophical value does "Eye of the Tiger" by Survivor celebrate?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It explores guilt, consequence, and the impossibility of escaping one''s actions"},{"id":"b","text":"Its length"},{"id":"c","text":"Its commercial success"},{"id":"d","text":"Its opera section"}]',
    correct_answer = 'a',
    wrong_explanations = '{"b":"Length is structural; the content is philosophically rich.","c":"Success reflects resonance, but the meaning is what makes it significant.","d":"The opera section expresses the internal conflict dramatically."}'
WHERE question = 'What makes "Bohemian Rhapsody" philosophically interesting?';

UPDATE quiz_questions
SET options = '[{"id":"a","text":"It doesn''t—it''s perfectly coherent"},{"id":"b","text":"It''s too short"},{"id":"c","text":"It critiques ''the system'' while Lennon profited enormously from capitalism"},{"id":"d","text":"The music contradicts the lyrics"}]',
    correct_answer = 'c',
    wrong_explanations = '{"a":"The contradiction between stated views and lived life is notable.","b":"Length is irrelevant to ideological consistency.","d":"Musically it''s coherent; the contradiction is ideological."}'
WHERE question = 'Why does "Working Class Hero" by John Lennon contain philosophical contradictions?';

COMMIT;

-- Distribution summary:
-- a: 34 questions (25.4%)
-- b: 34 questions (25.4%)
-- c: 33 questions (24.6%)
-- d: 33 questions (24.6%)
-- Total: 134 questions updated
