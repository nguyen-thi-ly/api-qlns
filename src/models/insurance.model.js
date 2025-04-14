import mongoose from "mongoose";

const insuranceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      ref: "Employee",
    },
    salaryForInsurance: {
      type: Number,
      required: true,
    },
    companyInsurance: {
      rate: {
        socialInsurance: { type: Number, required: true }, // %
        healthInsurance: { type: Number, required: true },
        unemploymentInsurance: { type: Number, required: true },
      },
      value: {
        socialInsurance: { type: Number },
        healthInsurance: { type: Number },
        unemploymentInsurance: { type: Number },
        total: { type: Number },
      },
    },
    employeeInsurance: {
      rate: {
        socialInsurance: { type: Number, required: true }, // %
        healthInsurance: { type: Number, required: true },
        unemploymentInsurance: { type: Number, required: true },
      },
      value: {
        socialInsurance: { type: Number },
        healthInsurance: { type: Number },
        unemploymentInsurance: { type: Number },
        total: { type: Number },
      },
    },
  },
  {
    timestamps: true,
  },
);

// 👉 Hàm tự tính từ lương và % input
function calculateInsurance(doc) {
  const salary = doc.salaryForInsurance || 0;

  const cRate = doc.companyInsurance?.rate || {};
  const eRate = doc.employeeInsurance?.rate || {};

  const companyValue = {
    socialInsurance: +((salary * (cRate.socialInsurance || 0)) / 100).toFixed(0),
    healthInsurance: +((salary * (cRate.healthInsurance || 0)) / 100).toFixed(0),
    unemploymentInsurance: +((salary * (cRate.unemploymentInsurance || 0)) / 100).toFixed(0),
  };
  companyValue.total = companyValue.socialInsurance + companyValue.healthInsurance + companyValue.unemploymentInsurance;

  const employeeValue = {
    socialInsurance: +((salary * (eRate.socialInsurance || 0)) / 100).toFixed(0),
    healthInsurance: +((salary * (eRate.healthInsurance || 0)) / 100).toFixed(0),
    unemploymentInsurance: +((salary * (eRate.unemploymentInsurance || 0)) / 100).toFixed(0),
  };
  employeeValue.total =
    employeeValue.socialInsurance + employeeValue.healthInsurance + employeeValue.unemploymentInsurance;

  doc.companyInsurance.value = companyValue;
  doc.employeeInsurance.value = employeeValue;
}

// Khi tạo
insuranceSchema.pre("save", function (next) {
  calculateInsurance(this);
  next();
});

// Khi cập nhật
insuranceSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const salary = update.salaryForInsurance;

  const cRate = update.companyInsurance?.rate;
  const eRate = update.employeeInsurance?.rate;

  if (salary != null && cRate && eRate) {
    const companyValue = {
      socialInsurance: +((salary * (cRate.socialInsurance || 0)) / 100).toFixed(0),
      healthInsurance: +((salary * (cRate.healthInsurance || 0)) / 100).toFixed(0),
      unemploymentInsurance: +((salary * (cRate.unemploymentInsurance || 0)) / 100).toFixed(0),
    };
    companyValue.total =
      companyValue.socialInsurance + companyValue.healthInsurance + companyValue.unemploymentInsurance;

    const employeeValue = {
      socialInsurance: +((salary * (eRate.socialInsurance || 0)) / 100).toFixed(0),
      healthInsurance: +((salary * (eRate.healthInsurance || 0)) / 100).toFixed(0),
      unemploymentInsurance: +((salary * (eRate.unemploymentInsurance || 0)) / 100).toFixed(0),
    };
    employeeValue.total =
      employeeValue.socialInsurance + employeeValue.healthInsurance + employeeValue.unemploymentInsurance;

    update.companyInsurance.value = companyValue;
    update.employeeInsurance.value = employeeValue;
  }

  next();
});

const Insurance = mongoose.model("Insurance", insuranceSchema);
export default Insurance;
