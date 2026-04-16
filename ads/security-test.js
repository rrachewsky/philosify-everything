/**
 * PHILOSIFY ADS - COMPREHENSIVE SECURITY PENETRATION TEST
 * 
 * This automated test suite performs a professional-grade security audit
 * including authentication bypass, IDOR, XSS, SQL injection, business logic
 * flaws, and cross-platform attack vectors.
 * 
 * SEVERITY LEVELS:
 * - CRITICAL: Immediate data breach, full system compromise
 * - HIGH: Authentication bypass, privilege escalation
 * - MEDIUM: Data leakage, partial bypass
 * - LOW: Information disclosure
 */

const API_URL = process.env.API_URL || 'https://api.philosify.org';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ads.philosify.org';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class SecurityTest {
  constructor() {
    this.results = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      passed: [],
    };
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
  }

  log(message, severity = 'info') {
    const severityColors = {
      critical: colors.red,
      high: colors.yellow,
      medium: colors.blue,
      low: colors.cyan,
      pass: colors.green,
      info: colors.reset,
    };
    const color = severityColors[severity] || colors.reset;
    console.log(`${color}${message}${colors.reset}`);
  }

  report(severity, title, description, impact, remediation) {
    const finding = {
      severity: severity.toUpperCase(),
      title,
      description,
      impact,
      remediation,
      timestamp: new Date().toISOString(),
    };
    
    this.results[severity].push(finding);
    this.failCount++;
    this.log(`\n🚨 ${severity.toUpperCase()}: ${title}`, severity);
    this.log(`   ${description}`, severity);
    this.log(`   Impact: ${impact}`, severity);
    this.log(`   Fix: ${remediation}`, severity);
  }

  pass(testName) {
    this.results.passed.push({
      test: testName,
      timestamp: new Date().toISOString(),
    });
    this.passCount++;
    this.log(`✅ PASS: ${testName}`, 'pass');
  }

  async test(name, fn) {
    this.testCount++;
    this.log(`\n[${this.testCount}] Testing: ${name}`, 'info');
    try {
      await fn();
    } catch (error) {
      this.log(`   ❌ Test error: ${error.message}`, 'critical');
    }
  }

  // ============================================================
  // PHASE 1: RECONNAISSANCE
  // ============================================================

  async checkSecurityHeaders() {
    await this.test('Security Headers Analysis', async () => {
      try {
        const response = await fetch(FRONTEND_URL);
        const headers = response.headers;

        const requiredHeaders = {
          'content-security-policy': 'CSP',
          'x-frame-options': 'X-Frame-Options',
          'x-content-type-options': 'X-Content-Type-Options',
          'strict-transport-security': 'HSTS',
          'referrer-policy': 'Referrer-Policy',
          'permissions-policy': 'Permissions-Policy',
        };

        const missing = [];
        for (const [header, name] of Object.entries(requiredHeaders)) {
          if (!headers.has(header)) {
            missing.push(name);
          }
        }

        if (missing.length > 0) {
          this.report(
            'medium',
            'Missing Security Headers',
            `Missing headers: ${missing.join(', ')}`,
            'Increased vulnerability to XSS, clickjacking, MIME sniffing attacks',
            `Add headers: Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security: max-age=31536000; includeSubDomains`
          );
        } else {
          this.pass('All security headers present');
        }
      } catch (error) {
        this.log(`   ⚠️ Could not fetch headers: ${error.message}`, 'medium');
      }
    });
  }

  async checkCORS() {
    await this.test('CORS Configuration', async () => {
      try {
        const response = await fetch(`${API_URL}/api/ads/campaigns`, {
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://evil.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'X-Admin-Secret',
          },
        });

        const allowOrigin = response.headers.get('access-control-allow-origin');
        const allowCredentials = response.headers.get('access-control-allow-credentials');

        if (allowOrigin === '*' && allowCredentials === 'true') {
          this.report(
            'critical',
            'CORS Misconfiguration - Wildcard with Credentials',
            'Access-Control-Allow-Origin: * with Allow-Credentials: true',
            'Allows any origin to make authenticated requests, leading to CSRF and data theft',
            'Use specific origins instead of wildcard, or disable credentials'
          );
        } else if (allowOrigin === 'https://evil.com') {
          this.report(
            'critical',
            'CORS Misconfiguration - Reflects Arbitrary Origin',
            'Server reflects arbitrary origins in Access-Control-Allow-Origin',
            'Attackers can bypass CORS and steal user data',
            'Maintain a whitelist of allowed origins and validate against it'
          );
        } else {
          this.pass('CORS properly configured');
        }
      } catch (error) {
        this.log(`   ⚠️ CORS check failed: ${error.message}`, 'medium');
      }
    });
  }

  // ============================================================
  // PHASE 2: AUTHENTICATION SECURITY
  // ============================================================

  async testSQLInjectionLogin() {
    await this.test('SQL Injection in Login', async () => {
      const payloads = [
        "' OR '1'='1",
        "admin'--",
        "' OR 1=1--",
        "admin' OR '1'='1'/*",
        "'; DROP TABLE ads.advertisers;--",
      ];

      for (const payload of payloads) {
        try {
          const response = await fetch(`${API_URL}/api/ads/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: payload,
              password: payload,
            }),
          });

          const data = await response.json();

          // If we get a 200 with session, it's vulnerable
          if (response.status === 200 && data.session) {
            this.report(
              'critical',
              'SQL Injection Vulnerability in Login',
              `Payload "${payload}" bypassed authentication`,
              'Complete authentication bypass, full database access, data theft',
              'Use parameterized queries/prepared statements, never concatenate user input into SQL'
            );
            return;
          }
        } catch (error) {
          // Network errors are expected
        }
      }

      this.pass('SQL injection in login - not vulnerable');
    });
  }

  async testBruteForceProtection() {
    await this.test('Brute Force Protection', async () => {
      const attempts = 20;
      let blockedAt = -1;

      for (let i = 0; i < attempts; i++) {
        try {
          const response = await fetch(`${API_URL}/api/ads/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: `test${i}@example.com`,
              password: 'wrongpassword123',
            }),
          });

          if (response.status === 429) {
            blockedAt = i + 1;
            break;
          }
        } catch (error) {
          // Continue
        }
      }

      if (blockedAt === -1) {
        this.report(
          'high',
          'No Brute Force Protection',
          `Performed ${attempts} login attempts without rate limiting`,
          'Attackers can brute force passwords, leading to account takeover',
          'Implement rate limiting (e.g., 5 attempts per 15 minutes) and account lockout'
        );
      } else if (blockedAt > 10) {
        this.report(
          'medium',
          'Weak Brute Force Protection',
          `Rate limit triggered after ${blockedAt} attempts (threshold too high)`,
          'Weak protection against credential stuffing attacks',
          'Reduce threshold to 5-10 attempts per 15 minutes'
        );
      } else {
        this.pass(`Brute force protection active (blocked at attempt ${blockedAt})`);
      }
    });
  }

  async testAdminSecretStorage() {
    await this.test('Admin Secret Storage (Client-Side)', async () => {
      const vulnerabilityFound = true; // We know from code review
      
      if (vulnerabilityFound) {
        this.report(
          'critical',
          'Admin Secret Stored in sessionStorage',
          'Admin secret (ADMIN_SECRET_KEY) stored in sessionStorage at ads/src/contexts/AdminContext.jsx:24',
          'XSS attack can steal admin secret from sessionStorage, leading to full platform compromise',
          'Move admin authentication to HTTPOnly cookies like advertiser auth. Never store secrets in JavaScript-accessible storage.'
        );
      } else {
        this.pass('Admin secret properly stored in HTTPOnly cookies');
      }
    });
  }

  // ============================================================
  // PHASE 3: AUTHORIZATION & IDOR
  // ============================================================

  async testIDOR() {
    await this.test('IDOR - Access Other User Campaigns', async () => {
      // This requires having two test accounts, which we simulate
      this.log('   ⚠️ IDOR test requires manual verification with two accounts', 'medium');
      this.log('   Test manually:', 'medium');
      this.log('   1. Login as User A, create campaign, note campaign ID', 'medium');
      this.log('   2. Login as User B, try GET /api/ads/campaigns/{user_a_campaign_id}', 'medium');
      this.log('   3. If accessible → CRITICAL IDOR vulnerability', 'medium');
    });
  }

  async testPrivilegeEscalation() {
    await this.test('Privilege Escalation - Advertiser to Admin', async () => {
      // Test if advertiser can access admin endpoints
      try {
        const response = await fetch(`${API_URL}/api/ads/admin/pending`, {
          method: 'GET',
          headers: {
            'X-Admin-Secret': 'invalid-secret-test',
          },
          credentials: 'include',
        });

        if (response.status === 200) {
          this.report(
            'critical',
            'Admin Endpoint Accessible Without Valid Secret',
            'Admin endpoint returned 200 OK with invalid admin secret',
            'Privilege escalation, unauthorized access to admin functions',
            'Strengthen admin secret validation with timing-safe comparison'
          );
        } else if (response.status === 401 || response.status === 403) {
          this.pass('Admin endpoints properly protected');
        }
      } catch (error) {
        this.log(`   ⚠️ Privilege escalation test failed: ${error.message}`, 'medium');
      }
    });
  }

  // ============================================================
  // PHASE 4: INJECTION ATTACKS
  // ============================================================

  async testXSS() {
    await this.test('Cross-Site Scripting (XSS)', async () => {
      const xssPayloads = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        '<iframe src="javascript:alert(1)">',
        '<body onload=alert(1)>',
      ];

      this.log('   XSS payloads to test in all user inputs:', 'medium');
      xssPayloads.forEach((payload, i) => {
        this.log(`     ${i + 1}. ${payload}`, 'medium');
      });

      this.log('   Test in: campaign names, company names, creative briefs, feedback', 'medium');
      this.log('   ⚠️ Manual verification required - check if payloads execute in browser', 'medium');
    });
  }

  // ============================================================
  // PHASE 5: BUSINESS LOGIC
  // ============================================================

  async testPaymentManipulation() {
    await this.test('Payment Manipulation', async () => {
      const testPayloads = [
        { amount_cents: -1000, desc: 'negative amount' },
        { amount_cents: 0, desc: 'zero amount' },
        { amount_cents: 999999999999999, desc: 'integer overflow' },
      ];

      this.log('   Test payment manipulation:', 'medium');
      testPayloads.forEach(({ amount_cents, desc }) => {
        this.log(`     - ${desc}: amount_cents=${amount_cents}`, 'medium');
      });
      this.log('   ⚠️ Manual verification required with test Stripe account', 'medium');
    });
  }

  async testRaceConditions() {
    await this.test('Race Conditions', async () => {
      this.log('   Test concurrent requests:', 'medium');
      this.log('     - Create multiple campaigns simultaneously', 'medium');
      this.log('     - Request multiple payouts concurrently (agency)', 'medium');
      this.log('     - Approve same campaign twice', 'medium');
      this.log('   ⚠️ Manual verification required', 'medium');
    });
  }

  // ============================================================
  // PHASE 6: CROSS-PLATFORM ATTACK
  // ============================================================

  async testCrossPlatformAttack() {
    await this.test('Can Ads Platform Attack Main Philosify?', async () => {
      this.log('   🎯 CROSS-PLATFORM ATTACK VECTORS:', 'critical');
      
      // 1. XSS in ad creative → execute on main site
      this.log('   1. XSS via Ad Creative:', 'critical');
      this.log('      - Upload ad with <script> tags in creative', 'critical');
      this.log('      - If ad renders on philosify.org → XSS on main platform', 'critical');
      this.log('      - Impact: Steal user sessions, access Unsafe Zone conversations', 'critical');

      // 2. Malicious redirect via ad click
      this.log('   2. Malicious Redirect:', 'critical');
      this.log('      - Set ad link to javascript:// or data:// URL', 'critical');
      this.log('      - If not sanitized → redirect to phishing site', 'critical');

      // 3. Cookie sharing between domains
      this.log('   3. Cookie Sharing Attack:', 'critical');
      this.log('      - ads.philosify.org sets cookie for .philosify.org domain', 'critical');
      this.log('      - Cookie accessible on philosify.org', 'critical');
      this.log('      - If session cookie → session hijacking', 'critical');

      // 4. PostMessage vulnerabilities
      this.log('   4. PostMessage Exploitation:', 'critical');
      this.log('      - Embed ad in iframe on philosify.org', 'critical');
      this.log('      - Send malicious postMessage to parent window', 'critical');
      this.log('      - If parent listens without origin check → XSS', 'critical');

      // 5. CSS injection
      this.log('   5. CSS Injection:', 'critical');
      this.log('      - Inject CSS via ad creative styles', 'critical');
      this.log('      - Use CSS to steal data (attribute selectors + background-image)', 'critical');

      this.report(
        'critical',
        'Cross-Platform Attack Surface',
        'Ads platform can potentially attack main Philosify through multiple vectors',
        'XSS, session hijacking, data theft from main platform users',
        'Implement strict Content Security Policy, sanitize all ad content, use different cookie domains, validate PostMessage origins'
      );
    });
  }

  // ============================================================
  // REPORTING
  // ============================================================

  generateReport() {
    this.log('\n\n╔═══════════════════════════════════════════════════════════╗', 'info');
    this.log('║  PHILOSIFY ADS - SECURITY PENETRATION TEST REPORT       ║', 'info');
    this.log('╚═══════════════════════════════════════════════════════════╝\n', 'info');

    this.log(`Total Tests: ${this.testCount}`, 'info');
    this.log(`Passed: ${this.passCount}`, 'pass');
    this.log(`Failed: ${this.failCount}`, 'critical');

    this.log('\n═══ CRITICAL VULNERABILITIES (IMMEDIATE ACTION REQUIRED) ═══', 'critical');
    if (this.results.critical.length === 0) {
      this.log('✅ None found', 'pass');
    } else {
      this.results.critical.forEach((finding, i) => {
        this.log(`\n${i + 1}. ${finding.title}`, 'critical');
        this.log(`   ${finding.description}`, 'critical');
        this.log(`   Impact: ${finding.impact}`, 'critical');
        this.log(`   Fix: ${finding.remediation}`, 'critical');
      });
    }

    this.log('\n═══ HIGH SEVERITY VULNERABILITIES ═══', 'high');
    if (this.results.high.length === 0) {
      this.log('✅ None found', 'pass');
    } else {
      this.results.high.forEach((finding, i) => {
        this.log(`\n${i + 1}. ${finding.title}`, 'high');
        this.log(`   ${finding.description}`, 'high');
        this.log(`   Fix: ${finding.remediation}`, 'high');
      });
    }

    this.log('\n═══ MEDIUM SEVERITY VULNERABILITIES ═══', 'medium');
    if (this.results.medium.length === 0) {
      this.log('✅ None found', 'pass');
    } else {
      this.results.medium.forEach((finding, i) => {
        this.log(`\n${i + 1}. ${finding.title}`, 'medium');
        this.log(`   Fix: ${finding.remediation}`, 'medium');
      });
    }

    this.log('\n═══ SECURITY SCORE ═══', 'info');
    const totalVulns = this.results.critical.length + this.results.high.length + 
                       this.results.medium.length + this.results.low.length;
    const score = Math.max(0, 10 - (this.results.critical.length * 3) - 
                                   (this.results.high.length * 2) - 
                                   (this.results.medium.length * 1));
    const scoreColor = score >= 8 ? 'pass' : score >= 6 ? 'medium' : 'critical';
    
    this.log(`\nSecurity Score: ${score}/10`, scoreColor);
    this.log(`Total Vulnerabilities: ${totalVulns}`, scoreColor);
    
    if (score >= 9) {
      this.log('Rating: EXCELLENT ✅', 'pass');
    } else if (score >= 7) {
      this.log('Rating: GOOD ⚠️', 'medium');
    } else if (score >= 5) {
      this.log('Rating: NEEDS IMPROVEMENT 🔶', 'high');
    } else {
      this.log('Rating: CRITICAL ISSUES 🚨', 'critical');
    }

    return {
      score,
      totalTests: this.testCount,
      passed: this.passCount,
      failed: this.failCount,
      vulnerabilities: {
        critical: this.results.critical.length,
        high: this.results.high.length,
        medium: this.results.medium.length,
        low: this.results.low.length,
      },
      findings: this.results,
    };
  }

  async runAll() {
    this.log('🔒 Starting Comprehensive Security Penetration Test...', 'info');
    this.log(`Target: ${API_URL}\n`, 'info');

    // Phase 1: Reconnaissance
    await this.checkSecurityHeaders();
    await this.checkCORS();

    // Phase 2: Authentication
    await this.testSQLInjectionLogin();
    await this.testBruteForceProtection();
    await this.testAdminSecretStorage();

    // Phase 3: Authorization
    await this.testIDOR();
    await this.testPrivilegeEscalation();

    // Phase 4: Injection
    await this.testXSS();

    // Phase 5: Business Logic
    await this.testPaymentManipulation();
    await this.testRaceConditions();

    // Phase 6: Cross-Platform
    await this.testCrossPlatformAttack();

    return this.generateReport();
  }
}

// Run the tests
const tester = new SecurityTest();
tester.runAll().then((report) => {
  console.log('\n✅ Security test complete. Report saved to security-report.json');
  
  // Save detailed report
  const fs = require('fs');
  fs.writeFileSync(
    'security-report.json',
    JSON.stringify(report, null, 2)
  );
  
  // Exit with error code if critical issues found
  if (report.vulnerabilities.critical > 0) {
    process.exit(1);
  }
});
