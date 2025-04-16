import mongoose from "mongoose";
import Salary from "./salary.model.js"; // Import bảng lương

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
        socialInsurance: { type: Number, required: true },
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
        socialInsurance: { type: Number, required: true },
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

// 👉 Hàm tự tính toán giá trị bảo hiểm
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

// ✅ Hàm cập nhật bảo hiểm vào bảng lương
async function updateSalaryInsurance(employeeId, insuranceValue) {
  try {
    const result = await Salary.updateMany(
      { employeeId }, // Nếu muốn chỉ update theo kỳ thì thêm điều kiện
      { employeeInsurance: insuranceValue },
    );
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật bảo hiểm trong bảng lương:", error);
  }
}

// Middleware khi tạo mới
insuranceSchema.pre("save", function (next) {
  calculateInsurance(this);
  next();
});

insuranceSchema.post("save", async function () {
  if (this.employeeInsurance?.value?.total) {
    await updateSalaryInsurance(this.employeeId, this.employeeInsurance.value.total);
  } else {
    console.warn("⚠️ Không tìm thấy giá trị bảo hiểm nhân viên để cập nhật salary.");
  }
});

// Middleware khi cập nhật
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

insuranceSchema.post("findOneAndUpdate", async function (doc) {
  if (doc && doc.employeeInsurance?.value?.total) {
    await updateSalaryInsurance(doc.employeeId, doc.employeeInsurance.value.total);
  } else {
    const updatedDoc = await this.model.findOne(this.getQuery());
    if (updatedDoc && updatedDoc.employeeInsurance?.value?.total) {
      await updateSalaryInsurance(updatedDoc.employeeId, updatedDoc.employeeInsurance.value.total);
    } else {
      console.warn("⚠️ Không tìm được document hoặc thiếu thông tin để cập nhật Salary.");
    }
  }
});

const Insurance = mongoose.model("Insurance", insuranceSchema);
export default Insurance;
