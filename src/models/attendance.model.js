import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      ref: "Employee",
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    attendanceData: [
      {
        date: {
          type: Date,
          required: true,
        },
        dayOfWeek: {
          type: String,
          enum: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
          required: true,
        },
        value: {
          type: Number,
          required: true,
          default: 0,
          validate: {
            validator: function (v) {
              return v === 0 || v === 0.5 || v === 1;
            },
            message: (props) => `${props.value} không phải giá trị công hợp lệ (0, 0.5, 1)`,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Thêm index để tìm kiếm nhanh
attendanceSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
