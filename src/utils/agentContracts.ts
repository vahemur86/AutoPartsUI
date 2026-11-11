import type { AgentContractListItemDto, RepaymentTermsSnapshotDto } from "@/types/agentContracts";

export const isProductCreditContract = (
  contract: Pick<AgentContractListItemDto, "allowsProductAdvance"> & {
    repaymentTerms?: Pick<RepaymentTermsSnapshotDto, "type"> | null;
  },
) =>
  contract.allowsProductAdvance === true ||
  contract.repaymentTerms?.type === "ProductCredit";
