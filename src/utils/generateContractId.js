import Contract from "../models/contract.model.js";

const generateContractId = async () => {
  const lastContract = await Contract.findOne({}).sort({ contractId: -1 });

  let nextNumber = 1;

  if (lastContract && lastContract.contractId) {
    const match = lastContract.contractId.match(/HD-DEHA-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `HD-DEHA-${String(nextNumber).padStart(4, "0")}`;
};

export default generateContractId;
