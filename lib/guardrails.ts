export function isOnTopic(message: string): boolean {
  const allowedTopics = [
    "health insurance",
    "employee benefits",
    "HSA",
    "FSA",
    "COBRA",
    "compliance",
    "health plan",
    "Medicare",
    "deductible",
    "copay",
    "network",
    "dependent coverage",
    "open enrollment",
    "vision",
    "dental",
    "telemedicine",
    "EOB",
    "HR questions",
    "wellness programs",
    "ACA",
    "ERISA",
  ];

  const msg = message.toLowerCase();
  return allowedTopics.some(topic => msg.includes(topic));
}
