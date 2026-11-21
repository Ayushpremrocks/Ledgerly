/** Who/what a transaction was with, from the viewer's side. */
export function txTitle(t) {
  if (t.transactionType === "DEPOSIT") return t.description || "Deposit";
  if (t.transactionType === "WITHDRAWAL") return t.description || "Withdrawal";
  if (t.direction === "INTERNAL") return "Between your accounts";
  if (t.direction === "CREDIT") return t.fromName || "Incoming transfer";
  return t.toName || "Outgoing transfer";
}
