/**
 * 数学口算练习配置数据
 * 每个年级包含多个难度等级，每个等级定义运算类型、数值范围和题目数量
 */
window.MATH_CONFIG = {
  1: {
    label: "一年级",
    levels: [
      { name: "10以内加法", ops: ["+"], range: [1, 10], count: 10 },
      { name: "10以内减法", ops: ["-"], range: [1, 10], count: 10 },
      { name: "10以内加减混合", ops: ["+", "-"], range: [1, 10], count: 15 },
      { name: "20以内进位加法", ops: ["+"], range: [1, 20], count: 10 },
      { name: "20以内退位减法", ops: ["-"], range: [1, 20], count: 10 },
      { name: "渐进挑战", progressive: true, count: 12 },
    ],
    timeLimit: 120,
  },
  2: {
    label: "二年级",
    levels: [
      { name: "表内乘法", ops: ["×"], range: [2, 9], count: 15 },
      { name: "表内除法", ops: ["÷"], range: [2, 9], count: 15 },
      { name: "100以内两位数加法", ops: ["+"], range: [10, 99], count: 10 },
      { name: "100以内两位数减法", ops: ["-"], range: [10, 99], count: 10 },
      { name: "有余数除法", ops: ["÷"], range: [2, 9], count: 10 },
      { name: "渐进挑战", progressive: true, count: 12 },
    ],
    timeLimit: 120,
  },
  3: {
    label: "三年级",
    levels: [
      { name: "万以内加法", ops: ["+"], range: [100, 9999], count: 10 },
      { name: "万以内减法", ops: ["-"], range: [100, 9999], count: 10 },
      { name: "一位数乘多位数", ops: ["×"], range: [2, 9], count: 10 },
      { name: "有余数除法深化", ops: ["÷"], range: [2, 9], count: 10 },
      { name: "简单分数比较", ops: ["<", ">"], range: [1, 10], count: 8 },
      { name: "渐进挑战", progressive: true, count: 12 },
    ],
    timeLimit: 150,
  },
  4: {
    label: "四年级",
    levels: [
      { name: "大数加法", ops: ["+"], range: [10000, 99999], count: 8 },
      { name: "大数减法", ops: ["-"], range: [10000, 99999], count: 8 },
      { name: "两位数乘两位数", ops: ["×"], range: [10, 99], count: 8 },
      { name: "除数两位数除法", ops: ["÷"], range: [10, 99], count: 8 },
      { name: "运算定律", ops: ["+", "×"], range: [10, 999], count: 8 },
      { name: "渐进挑战", progressive: true, count: 12 },
    ],
    timeLimit: 150,
  },
  5: {
    label: "五年级",
    levels: [
      { name: "小数加法", ops: ["+"], range: [1, 100], count: 10 },
      { name: "小数减法", ops: ["-"], range: [1, 100], count: 10 },
      { name: "小数乘法", ops: ["×"], range: [1, 100], count: 10 },
      { name: "小数除法", ops: ["÷"], range: [1, 100], count: 8 },
      { name: "简易方程", ops: ["="], range: [1, 100], count: 8 },
      { name: "渐进挑战", progressive: true, count: 12 },
    ],
    timeLimit: 180,
  },
  6: {
    label: "六年级",
    levels: [
      { name: "同分母分数加减法", ops: ["+", "-"], range: [1, 12], count: 10 },
      { name: "异分母分数加减法", ops: ["+", "-"], range: [2, 12], count: 8 },
      { name: "分数乘法", ops: ["×"], range: [1, 12], count: 8 },
      { name: "分数除法", ops: ["÷"], range: [1, 12], count: 8 },
      { name: "百分数与比例", ops: ["%", ":"], range: [1, 100], count: 8 },
      { name: "渐进挑战", progressive: true, count: 12 },
    ],
    timeLimit: 180,
  },
};
