import payPeriodModel from "../models/payPeriod.model.js";

export const createPayPeriod = async (req, res) => {
  const { month, year, employees } = req.body;
  try {
    const payPeriod = await payPeriodModel.create({
      namePayPeriod: `Kỳ trả lương ${month}/${year}-TSC-HO`,
      employees,
    });
    res.status(201).json({
      success: true,
      message: "Tạo kỳ lương thành công",
      data: payPeriod,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Tạo kỳ lương thất bại",
      error: error.message,
    });
  }
};

export const getPayPeriod = async (req, res) => {
  try {
    const payPeriods = await payPeriodModel.find().lean();
    res.status(200).json({
      success: true,
      message: "Lấy danh sách kỳ lương thành công",
      data: payPeriods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lấy danh sách kỳ lương thất bại",
      error: error.message,
    });
  }
};

export const getPayPeriodById = async (req, res) => {
  const { id } = req.params;
  try {
    const payPeriod = await payPeriodModel.findById(id).lean();
    if (!payPeriod) {
      return res.status(404).json({
        success: false,
        message: "Kỳ lương không tồn tại",
      });
    }
    res.status(200).json({
      success: true,
      message: "Lấy thông tin kỳ lương thành công",
      data: payPeriod,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lấy thông tin kỳ lương thất bại",
      error: error.message,
    });
  }
};
