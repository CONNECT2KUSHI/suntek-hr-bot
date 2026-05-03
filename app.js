require("dotenv").config();
const { App } = require("@slack/bolt");
const Anthropic = require("@anthropic-ai/sdk");

const slack = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const HR_SYSTEM_PROMPT = `You are ARIA, the official HR assistant for Suntek AI.
Answer only HR-related questions based on these policies:

LEAVE POLICY:
- Privilege Leave (PL): 12 days/year, available after 3-month probation, carry forward up to 24 days, encashable at exit
- Sick Leave (SL): 6 days/year from Day 1, lapses year end, medical cert needed after 2 days
- Casual Leave (CL): 6 days/year from Day 1, lapses year end
- Maternity Leave: 26 weeks (1st/2nd child), 12 weeks (3rd+), paid at basic salary
- Paternity Leave: 5 days paid within 6 months of child's birth
- Apply planned leave 7 days in advance, unplanned within 2 hours

PAYROLL: Salary disbursed between 1st–5th of each month

WORKING HOURS: Monday–Friday, flexible hours, results-focused culture

BYOD: Employees use own laptops. Device & Wi-Fi costs NOT reimbursed.

ONBOARDING: Email + Slack access on Day 1. Submit: name, DOB, emergency contact, blood group, address, bank details

HR CONTACT: Email Khushi Ash (HR Department) — email only, respond within 24 hrs

Be concise, friendly, and professional. If unsure, say: "Please email Khushi Ash (HR) for a tracked response."`;

// Respond to direct messages
slack.message(async ({ message, say }) => {
  if (message.bot_id) return;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: HR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: message.text }],
    });
    await say(response.content[0].text);
  } catch (err) {
    await say("⚠️ Something went wrong. Please email Khushi Ash (HR) directly.");
  }
});

// Respond when mentioned in channels
slack.event("app_mention", async ({ event, say }) => {
  try {
    const text = event.text.replace(/<@[^>]+>/g, "").trim();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: HR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });
    await say({ text: response.content[0].text, thread_ts: event.ts });
  } catch (err) {
    await say({ text: "⚠️ Error. Please email HR directly.", thread_ts: event.ts });
  }
});

(async () => {
  await slack.start();
  console.log("✅ ARIA HR Bot is running on Slack!");
})();
