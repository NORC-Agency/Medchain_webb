"use client";

import { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";

const monthNames = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December",
] as const;
const defaultStartMonth = 5;
const defaultEndMonth = 12;

type MonthValues = number[];
type Frequency = "Månadsvis" | "Kvartalsvis" | "Halvårsvis" | "Årsvis";
type Basis = "Månadsslut" | "Fakturadatum";
type Tab = "overview" | "revenue" | "people" | "costs" | "cash";
type ScenarioRecord = {
  id: string;
  name: string;
  updatedAt: string;
  snapshot: AppSnapshot;
};

type Customer = {
  name: string;
  revenue: MonthValues;
  paymentDays: number;
  basis: Basis;
  vat: boolean;
};

type Employee = {
  name: string;
  salary: number;
  pensionRate: number;
  workRate: MonthValues;
};

type Cost = {
  name: string;
  amount: MonthValues;
  frequency: Frequency;
  dueDay: number;
  dueMonth: number;
  vat: boolean;
};

type Assumptions = {
  budgetYear: number;
  startMonth: number;
  endMonth: number;
  startCash: number;
  startDebt: number;
  vatRate: number;
  employerTaxRate: number;
  insuranceRate: number;
  vatSchedule: "Månadsvis" | "Kvartalsvis";
  taxSchedule: "Månadsvis" | "Kvartalsvis";
  payrollDay: number;
  salaryPaidShare: number;
  employeeTaxRate: number;
  debtAmortization: number;
};

type AppSnapshot = {
  version: 1;
  customers: Customer[];
  employees: Employee[];
  costs: Cost[];
  assumptions: Assumptions;
};

const scenarioStorageKey = "norc-budget-scenarios-v1";

const initialCustomers: Customer[] = [
  { name: "SafeSpring", revenue: [226000, 226000, 0, 226000, 226000, 226000, 226000, 226000], paymentDays: 30, basis: "Månadsslut", vat: true },
  { name: "Accure", revenue: [0, 40000, 0, 40000, 40000, 40000, 40000, 40000], paymentDays: 30, basis: "Månadsslut", vat: true },
  { name: "Team Neusta", revenue: [0, 0, 0, 0, 0, 0, 0, 0], paymentDays: 30, basis: "Månadsslut", vat: true },
  { name: "Volvo Energy", revenue: [0, 0, 0, 0, 0, 0, 0, 0], paymentDays: 30, basis: "Månadsslut", vat: true },
  { name: "Buddy Energy", revenue: [0, 0, 0, 0, 0, 0, 0, 0], paymentDays: 30, basis: "Månadsslut", vat: true },
  { name: "Gausta", revenue: [0, 0, 0, 0, 0, 0, 0, 0], paymentDays: 30, basis: "Månadsslut", vat: true },
  { name: "Raoul", revenue: [0, 0, 0, 0, 0, 0, 0, 0], paymentDays: 30, basis: "Månadsslut", vat: true },
  { name: "MedChain", revenue: [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000], paymentDays: 30, basis: "Månadsslut", vat: true },
  { name: "Internetmedicin", revenue: [0, 0, 0, 0, 0, 0, 0, 0], paymentDays: 30, basis: "Månadsslut", vat: true },
  { name: "Fragus?", revenue: [0, 0, 0, 0, 0, 0, 0, 0], paymentDays: 30, basis: "Månadsslut", vat: true },
];

const initialEmployees: Employee[] = [
  { name: "Johan Sandersnäs", salary: 60000, pensionRate: 0.06, workRate: [0.2, 0.2, 0.5, 0.5, 0.8, 0.8, 0.8, 0.8] },
  { name: "Anders Rasmusson", salary: 60000, pensionRate: 0.06, workRate: [0.7, 0.7, 0.7, 0.7, 0.8, 0.8, 0.8, 0.8] },
  { name: "David Kremer", salary: 60000, pensionRate: 0.06, workRate: [0.2, 0.2, 0.5, 0.5, 0.8, 0.8, 0.8, 0.8] },
  { name: "Magnus Lindau", salary: 60000, pensionRate: 0.06, workRate: [0.2, 0.7, 0.7, 0.7, 0.8, 0.8, 0.8, 0.8] },
  { name: "Wilhelm Johansson", salary: 35000, pensionRate: 0.06, workRate: [0.2, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { name: "Ingrid Kraappa", salary: 60000, pensionRate: 0.06, workRate: [0.2, 0.2, 0.2, 0.2, 0.7, 0.7, 0.7, 0.7] },
];

const initialCosts: Cost[] = [
  { name: "Adobe Creative Suite", amount: [1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: true },
  { name: "Google Workspace", amount: [0, 0, 0, 0, 0, 0, 0, 0], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: true },
  { name: "AI bildredigeringsprogram", amount: [0, 0, 0, 0, 0, 0, 0, 0], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: true },
  { name: "AI videoredigeringsprogram", amount: [0, 0, 0, 0, 0, 0, 0, 0], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: true },
  { name: "Företagsförsäkring", amount: [0, 0, 0, 0, 0, 0, 0, 0], frequency: "Årsvis", dueDay: 31, dueMonth: 5, vat: false },
  { name: "Representation", amount: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: true },
  { name: "Telefonabbonemang", amount: [3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: true },
  { name: "Bokföring/Fakturering", amount: [0, 0, 0, 0, 0, 0, 0, 0], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: true },
  { name: "Projektstyrning", amount: [0, 0, 0, 0, 0, 0, 0, 0], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: true },
  { name: "Kontorshyra", amount: [0, 0, 0, 0, 0, 0, 0, 0], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: false },
  { name: "Förbrukning/kaffe/print/städ", amount: [0, 0, 0, 0, 0, 0, 0, 0], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: true },
  { name: "Engångsinvestering hårdvara", amount: [0, 0, 0, 0, 0, 0, 0, 0], frequency: "Månadsvis", dueDay: 25, dueMonth: 5, vat: true },
];

const initialAssumptions: Assumptions = {
  budgetYear: 2026,
  startMonth: defaultStartMonth,
  endMonth: defaultEndMonth,
  startCash: 0,
  startDebt: 0,
  vatRate: 0.25,
  employerTaxRate: 0.3142,
  insuranceRate: 0.005,
  vatSchedule: "Kvartalsvis",
  taxSchedule: "Månadsvis",
  payrollDay: 25,
  salaryPaidShare: 1,
  employeeTaxRate: 0,
  debtAmortization: 0,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(Math.round(value)) + " kr";
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(value * 100) + "%";
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function getPeriodMonths(startMonth: number, endMonth: number) {
  const start = Math.min(Math.max(Math.round(startMonth), 1), 12);
  const end = Math.min(Math.max(Math.round(endMonth), start), 12);
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const monthNumber = start + index;
    return {
      number: monthNumber,
      label: monthNames[monthNumber - 1],
      shortLabel: monthNames[monthNumber - 1].slice(0, 3),
    };
  });
}

function resizeValues(values: number[], length: number, fillValue = 0) {
  return Array.from({ length }, (_, index) => values[index] ?? fillValue);
}

function resizeScenarioData(customers: Customer[], employees: Employee[], costs: Cost[], length: number) {
  return {
    customers: customers.map((customer) => ({ ...customer, revenue: resizeValues(customer.revenue, length) })),
    employees: employees.map((employee) => ({ ...employee, workRate: resizeValues(employee.workRate, length) })),
    costs: costs.map((cost) => ({ ...cost, amount: resizeValues(cost.amount, length) })),
  };
}

function makeSnapshot(customers: Customer[], employees: Employee[], costs: Cost[], assumptions: Assumptions): AppSnapshot {
  return {
    version: 1,
    customers: customers.map((customer) => ({ ...customer, revenue: [...customer.revenue] })),
    employees: employees.map((employee) => ({ ...employee, workRate: [...employee.workRate] })),
    costs: costs.map((cost) => ({ ...cost, amount: [...cost.amount] })),
    assumptions: { ...assumptions },
  };
}

function parseNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["ja", "true", "1", "yes"].includes(normalized)) return true;
  if (["nej", "false", "0", "no"].includes(normalized)) return false;
  return fallback;
}

function parseBasis(value: unknown, fallback: Basis): Basis {
  return value === "Fakturadatum" || value === "Månadsslut" ? value : fallback;
}

function parseFrequency(value: unknown, fallback: Frequency): Frequency {
  return value === "Månadsvis" || value === "Kvartalsvis" || value === "Halvårsvis" || value === "Årsvis" ? value : fallback;
}

function parseSchedule(value: unknown, fallback: "Månadsvis" | "Kvartalsvis") {
  return value === "Månadsvis" || value === "Kvartalsvis" ? value : fallback;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function cellValue(value: ExcelJS.CellValue) {
  if (value && typeof value === "object") {
    if ("result" in value) return value.result;
    if ("text" in value) return value.text;
    if ("richText" in value) return value.richText.map((item) => item.text).join("");
  }
  return value ?? "";
}

function safeSheetRows(workbook: ExcelJS.Workbook, sheetName: string) {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) return [];
  const rows: unknown[][] = [];
  sheet.eachRow((row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(values.map((value) => cellValue(value as ExcelJS.CellValue)));
  });
  return rows;
}

function monthIndexFromDate(monthNumbers: number[], month: number) {
  return monthNumbers.indexOf(month);
}

function addMonths(month: number, delta: number) {
  return month + delta;
}

function paymentMonthForCustomer(month: number, days: number, basis: Basis) {
  const delay = basis === "Månadsslut" ? Math.ceil(days / 30) : Math.max(0, Math.floor(days / 30));
  return addMonths(month, delay);
}

function frequencyDueMonth(month: number, frequency: Frequency, dueMonth: number) {
  if (frequency === "Månadsvis") return month;
  if (frequency === "Kvartalsvis") return Math.ceil(month / 3) * 3;
  if (frequency === "Halvårsvis") return month <= 6 ? 6 : 12;
  return dueMonth;
}

function quarterEnd(month: number) {
  return Math.ceil(month / 3) * 3;
}

function calculateModel(
  customers: Customer[],
  employees: Employee[],
  costs: Cost[],
  assumptions: Assumptions,
  periodMonths: ReturnType<typeof getPeriodMonths>,
) {
  const monthNumbers = periodMonths.map((month) => month.number);
  const revenue = periodMonths.map((_, monthIndex) => sum(customers.map((customer) => customer.revenue[monthIndex] ?? 0)));
  const grossSalary = periodMonths.map((_, monthIndex) =>
    sum(employees.map((employee) => employee.salary * employee.workRate[monthIndex])),
  );
  const employerTax = grossSalary.map((value) => value * assumptions.employerTaxRate);
  const pension = periodMonths.map((_, monthIndex) =>
    sum(employees.map((employee) => employee.salary * employee.workRate[monthIndex] * employee.pensionRate)),
  );
  const insurance = grossSalary.map((value) => value * assumptions.insuranceRate);
  const peopleCost = periodMonths.map((_, index) => grossSalary[index] + employerTax[index] + pension[index] + insurance[index]);
  const accruedCosts = periodMonths.map((_, monthIndex) => sum(costs.map((cost) => cost.amount[monthIndex] ?? 0)));
  const pnlCost = periodMonths.map((_, index) => peopleCost[index] + accruedCosts[index]);
  const result = periodMonths.map((_, index) => revenue[index] - pnlCost[index]);

  const customerReceiptsExVat = Array(periodMonths.length).fill(0) as number[];
  const customerReceiptsVat = Array(periodMonths.length).fill(0) as number[];
  customers.forEach((customer) => {
    customer.revenue.forEach((value, index) => {
      const paymentMonth = paymentMonthForCustomer(monthNumbers[index], customer.paymentDays, customer.basis);
      const paymentIndex = monthIndexFromDate(monthNumbers, paymentMonth);
      if (paymentIndex >= 0) {
        customerReceiptsExVat[paymentIndex] += value;
        customerReceiptsVat[paymentIndex] += customer.vat ? value * assumptions.vatRate : 0;
      }
    });
  });

  const supplierPaymentsExVat = Array(periodMonths.length).fill(0) as number[];
  const supplierPaymentsVat = Array(periodMonths.length).fill(0) as number[];
  costs.forEach((cost) => {
    cost.amount.forEach((value, index) => {
      const dueMonth = frequencyDueMonth(monthNumbers[index], cost.frequency, cost.dueMonth);
      const paymentIndex = monthIndexFromDate(monthNumbers, dueMonth);
      if (paymentIndex >= 0) {
        supplierPaymentsExVat[paymentIndex] += value;
        supplierPaymentsVat[paymentIndex] += cost.vat ? value * assumptions.vatRate : 0;
      }
    });
  });

  const salaryPayments = grossSalary.map((value) => value * assumptions.salaryPaidShare);
  const taxPayments = Array(periodMonths.length).fill(0) as number[];
  grossSalary.forEach((gross, index) => {
    const taxBase = employerTax[index] + gross * assumptions.employeeTaxRate;
    const paymentMonth =
      assumptions.taxSchedule === "Månadsvis" ? monthNumbers[index] + 1 : quarterEnd(monthNumbers[index]) + 1;
    const paymentIndex = monthIndexFromDate(monthNumbers, paymentMonth);
    if (paymentIndex >= 0) taxPayments[paymentIndex] += taxBase;
  });

  const generatedVat = periodMonths.map((_, index) => {
    const outputVat = sum(customers.map((customer) => (customer.vat ? customer.revenue[index] * assumptions.vatRate : 0)));
    const inputVat = sum(costs.map((cost) => (cost.vat ? cost.amount[index] * assumptions.vatRate : 0)));
    return outputVat - inputVat;
  });

  const vatPayments = Array(periodMonths.length).fill(0) as number[];
  generatedVat.forEach((value, index) => {
    const paymentMonth = assumptions.vatSchedule === "Månadsvis" ? monthNumbers[index] + 1 : quarterEnd(monthNumbers[index]) + 1;
    const paymentIndex = monthIndexFromDate(monthNumbers, paymentMonth);
    if (paymentIndex >= 0) vatPayments[paymentIndex] += value;
  });

  const receipts = periodMonths.map((_, index) => customerReceiptsExVat[index] + customerReceiptsVat[index]);
  const outflows = periodMonths.map(
    (_, index) =>
      salaryPayments[index] +
      supplierPaymentsExVat[index] +
      supplierPaymentsVat[index] +
      taxPayments[index] +
      vatPayments[index] +
      assumptions.debtAmortization,
  );
  const monthlyCashFlow = periodMonths.map((_, index) => receipts[index] - outflows[index]);
  const closingCash: number[] = [];
  monthlyCashFlow.forEach((flow, index) => {
    const opening = index === 0 ? assumptions.startCash - assumptions.startDebt : closingCash[index - 1];
    closingCash[index] = opening + flow;
  });

  return {
    revenue,
    grossSalary,
    peopleCost,
    accruedCosts,
    pnlCost,
    result,
    customerReceiptsExVat,
    customerReceiptsVat,
    supplierPaymentsExVat,
    supplierPaymentsVat,
    salaryPayments,
    taxPayments,
    vatPayments,
    receipts,
    outflows,
    monthlyCashFlow,
    closingCash,
    generatedVat,
  };
}

function NumberInput({
  value,
  onChange,
  suffix,
  step = 1000,
}: {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="norc-input-wrap">
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {suffix ? <span>{suffix}</span> : null}
    </label>
  );
}

function MiniBarChart({ values, periodMonths }: { values: number[]; periodMonths: ReturnType<typeof getPeriodMonths> }) {
  const max = Math.max(...values.map((value) => Math.abs(value)), 1);
  return (
    <div className="norc-bars" aria-label="Kassaflöde per månad" style={{ gridTemplateColumns: `repeat(${periodMonths.length}, 1fr)` }}>
      {values.map((value, index) => (
        <div className="norc-bar-cell" key={periodMonths[index]?.label ?? index}>
          <div className="norc-bar-track">
            <span
              className={value < 0 ? "is-negative" : "is-positive"}
              style={{
                height: `${Math.max(6, (Math.abs(value) / max) * 100)}%`,
              }}
            />
          </div>
          <small>{periodMonths[index]?.shortLabel ?? ""}</small>
        </div>
      ))}
    </div>
  );
}

function LineChart({
  revenue,
  costs,
  periodMonths,
}: {
  revenue: number[];
  costs: number[];
  periodMonths: ReturnType<typeof getPeriodMonths>;
}) {
  const width = 720;
  const height = 240;
  const padding = 28;
  const allValues = [...revenue, ...costs];
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const valueRange = Math.max(maxValue - minValue, 1);

  function point(value: number, index: number) {
    const denominator = Math.max(periodMonths.length - 1, 1);
    const x = padding + (index / denominator) * (width - padding * 2);
    const y = height - padding - ((value - minValue) / valueRange) * (height - padding * 2);
    return `${x},${y}`;
  }

  const revenuePoints = revenue.map(point).join(" ");
  const costPoints = costs.map(point).join(" ");

  return (
    <div className="norc-line-chart" aria-label="Intäkter och kostnader per månad">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <title>Intäkter och kostnader</title>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padding + tick * (height - padding * 2);
          return <line key={tick} x1={padding} x2={width - padding} y1={y} y2={y} />;
        })}
        <polyline className="is-revenue" points={revenuePoints} />
        <polyline className="is-cost" points={costPoints} />
        {revenue.map((value, index) => {
          const [x, y] = point(value, index).split(",").map(Number);
          return <circle className="is-revenue" key={`revenue-${periodMonths[index]?.label ?? index}`} cx={x} cy={y} r="4" />;
        })}
        {costs.map((value, index) => {
          const [x, y] = point(value, index).split(",").map(Number);
          return <circle className="is-cost" key={`cost-${periodMonths[index]?.label ?? index}`} cx={x} cy={y} r="4" />;
        })}
      </svg>
      <div className="norc-line-chart-labels" style={{ gridTemplateColumns: `repeat(${periodMonths.length}, 1fr)` }}>
        {periodMonths.map((month) => (
          <span key={month.label}>{month.shortLabel}</span>
        ))}
      </div>
      <div className="norc-chart-legend">
        <span className="is-revenue">Intäkter</span>
        <span className="is-cost">Kostnader</span>
      </div>
    </div>
  );
}

export function NorcBudgetApp() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [costs, setCosts] = useState<Cost[]>(initialCosts);
  const [assumptions, setAssumptions] = useState<Assumptions>(initialAssumptions);
  const [scenarioName, setScenarioName] = useState("Bas");
  const [savedScenarios, setSavedScenarios] = useState<ScenarioRecord[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const periodMonths = useMemo(() => getPeriodMonths(assumptions.startMonth, assumptions.endMonth), [assumptions.startMonth, assumptions.endMonth]);
  const monthLabels = periodMonths.map((month) => month.label);
  const model = useMemo(() => calculateModel(customers, employees, costs, assumptions, periodMonths), [customers, employees, costs, assumptions, periodMonths]);
  const totalRevenue = sum(model.revenue);
  const totalResult = sum(model.result);
  const minLiquidity = Math.min(...model.closingCash);
  const decemberLiquidity = model.closingCash[model.closingCash.length - 1];
  const creditNeed = Math.max(0, -minLiquidity);
  const creditNeedMonth = periodMonths[model.closingCash.indexOf(minLiquidity)]?.label ?? periodMonths[0]?.label ?? "";

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(scenarioStorageKey);
      if (stored) setSavedScenarios(JSON.parse(stored) as ScenarioRecord[]);
    } catch {
      setStatusMessage("Kunde inte läsa sparade scenarier.");
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(scenarioStorageKey, JSON.stringify(savedScenarios));
    } catch {
      setStatusMessage("Kunde inte spara scenarier i webbläsaren.");
    }
  }, [savedScenarios]);

  function applySnapshot(snapshot: AppSnapshot) {
    const nextAssumptions = { ...initialAssumptions, ...snapshot.assumptions };
    const nextPeriodLength = getPeriodMonths(nextAssumptions.startMonth, nextAssumptions.endMonth).length;
    const resized = resizeScenarioData(snapshot.customers, snapshot.employees, snapshot.costs, nextPeriodLength);
    setCustomers(resized.customers);
    setEmployees(resized.employees);
    setCosts(resized.costs);
    setAssumptions(nextAssumptions);
  }

  function saveScenario() {
    const trimmedName = scenarioName.trim() || "Nytt scenario";
    const now = new Date().toISOString();
    const snapshot = makeSnapshot(customers, employees, costs, assumptions);
    const existingId = activeScenarioId || `scenario-${Date.now()}`;
    setSavedScenarios((current) => {
      const nextRecord = { id: existingId, name: trimmedName, updatedAt: now, snapshot };
      const exists = current.some((scenario) => scenario.id === existingId);
      return exists ? current.map((scenario) => (scenario.id === existingId ? nextRecord : scenario)) : [nextRecord, ...current];
    });
    setActiveScenarioId(existingId);
    setStatusMessage(`Sparade "${trimmedName}".`);
  }

  function loadScenario(id: string) {
    const scenario = savedScenarios.find((item) => item.id === id);
    if (!scenario) return;
    applySnapshot(scenario.snapshot);
    setScenarioName(scenario.name);
    setActiveScenarioId(scenario.id);
    setStatusMessage(`Laddade "${scenario.name}".`);
  }

  function deleteScenario() {
    if (!activeScenarioId) return;
    const scenario = savedScenarios.find((item) => item.id === activeScenarioId);
    setSavedScenarios((current) => current.filter((item) => item.id !== activeScenarioId));
    setActiveScenarioId("");
    setStatusMessage(scenario ? `Tog bort "${scenario.name}".` : "Scenario borttaget.");
  }

  async function exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "NORC Budget App";
    workbook.created = new Date();
    const summaryRows = [
      ["Rad", ...monthLabels, "Totalt"],
      ["Intäkter", ...model.revenue, sum(model.revenue)],
      ["Personalkostnader", ...model.peopleCost.map((value) => -value), -sum(model.peopleCost)],
      ["Övriga kostnader", ...model.accruedCosts.map((value) => -value), -sum(model.accruedCosts)],
      ["Resultat", ...model.result, sum(model.result)],
      ["Kassaflöde", ...model.monthlyCashFlow, sum(model.monthlyCashFlow)],
      ["Utgående likviditet", ...model.closingCash, decemberLiquidity],
      [],
      ["Scenario", scenarioName],
      ["Exporterad", new Date().toLocaleString("sv-SE")],
    ];
    const customerRows = [
      ["Kund", ...monthLabels, "Betalningsdagar", "Beräkna från", "Momspliktig"],
      ...customers.map((customer) => [customer.name, ...customer.revenue, customer.paymentDays, customer.basis, customer.vat ? "Ja" : "Nej"]),
    ];
    const employeeRows = [
      ["Anställd", "Lön", "Pension %", ...monthLabels.map((month) => `${month} arbetsgrad %`)],
      ...employees.map((employee) => [employee.name, employee.salary, employee.pensionRate, ...employee.workRate]),
    ];
    const costRows = [
      ["Kostnad", ...monthLabels, "Frekvens", "Förfallodag", "Förfallomånad", "Momspliktig"],
      ...costs.map((cost) => [cost.name, ...cost.amount, cost.frequency, cost.dueDay, cost.dueMonth, cost.vat ? "Ja" : "Nej"]),
    ];
    const assumptionRows = [
      ["Nyckel", "Värde"],
      ["budgetYear", assumptions.budgetYear],
      ["startMonth", assumptions.startMonth],
      ["endMonth", assumptions.endMonth],
      ["startCash", assumptions.startCash],
      ["startDebt", assumptions.startDebt],
      ["vatRate", assumptions.vatRate],
      ["employerTaxRate", assumptions.employerTaxRate],
      ["insuranceRate", assumptions.insuranceRate],
      ["vatSchedule", assumptions.vatSchedule],
      ["taxSchedule", assumptions.taxSchedule],
      ["payrollDay", assumptions.payrollDay],
      ["salaryPaidShare", assumptions.salaryPaidShare],
      ["employeeTaxRate", assumptions.employeeTaxRate],
      ["debtAmortization", assumptions.debtAmortization],
    ];

    [
      ["Översikt", summaryRows],
      ["Kunder", customerRows],
      ["Personal", employeeRows],
      ["Kostnader", costRows],
      ["Antaganden", assumptionRows],
    ].forEach(([name, rows]) => {
      const sheet = workbook.addWorksheet(name as string);
      sheet.addRows(rows as unknown[][]);
      sheet.getRow(1).font = { bold: true };
      sheet.columns.forEach((column) => {
        column.width = 18;
      });
      sheet.views = [{ state: "frozen", ySplit: 1 }];
    });

    const output = await workbook.xlsx.writeBuffer();
    downloadBlob(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `NORC-${scenarioName || "scenario"}.xlsx`);
    setStatusMessage("Exporterade Excel-fil.");
  }

  async function importFromExcel(file: File) {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const customerRows = safeSheetRows(workbook, "Kunder").slice(1);
    const employeeRows = safeSheetRows(workbook, "Personal").slice(1);
    const costRows = safeSheetRows(workbook, "Kostnader").slice(1);
    const assumptionRows = safeSheetRows(workbook, "Antaganden").slice(1);
    if (!customerRows.length || !employeeRows.length || !costRows.length || !assumptionRows.length) {
      setStatusMessage("Importen behöver blad som heter Kunder, Personal, Kostnader och Antaganden.");
      return;
    }

    const assumptionMap = new Map(assumptionRows.map((row) => [String(row[0]), row[1]]));
    const importedStartMonth = parseNumber(assumptionMap.get("startMonth"), assumptions.startMonth);
    const importedEndMonth = parseNumber(assumptionMap.get("endMonth"), assumptions.endMonth);
    const importedPeriodMonths = getPeriodMonths(importedStartMonth, importedEndMonth);
    const importedPeriodLength = importedPeriodMonths.length;
    const customerPaymentOffset = importedPeriodLength + 1;
    const employeeWorkRateOffset = 3;
    const costFrequencyOffset = importedPeriodLength + 1;

    const nextCustomers = customerRows
      .filter((row) => row[0])
      .map((row, index) => {
        const fallback = initialCustomers[index] ?? initialCustomers[0];
        return {
          name: String(row[0]),
          revenue: importedPeriodMonths.map((_, monthIndex) => parseNumber(row[monthIndex + 1], fallback.revenue[monthIndex] ?? 0)),
          paymentDays: parseNumber(row[customerPaymentOffset], fallback.paymentDays),
          basis: parseBasis(row[customerPaymentOffset + 1], fallback.basis),
          vat: parseBoolean(row[customerPaymentOffset + 2], fallback.vat),
        };
      });
    const nextEmployees = employeeRows
      .filter((row) => row[0])
      .map((row, index) => {
        const fallback = initialEmployees[index] ?? initialEmployees[0];
        return {
          name: String(row[0]),
          salary: parseNumber(row[1], fallback.salary),
          pensionRate: parseNumber(row[2], fallback.pensionRate),
          workRate: importedPeriodMonths.map((_, monthIndex) => parseNumber(row[monthIndex + employeeWorkRateOffset], fallback.workRate[monthIndex] ?? 0)),
        };
      });
    const nextCosts = costRows
      .filter((row) => row[0])
      .map((row, index) => {
        const fallback = initialCosts[index] ?? initialCosts[0];
        return {
          name: String(row[0]),
          amount: importedPeriodMonths.map((_, monthIndex) => parseNumber(row[monthIndex + 1], fallback.amount[monthIndex] ?? 0)),
          frequency: parseFrequency(row[costFrequencyOffset], fallback.frequency),
          dueDay: parseNumber(row[costFrequencyOffset + 1], fallback.dueDay),
          dueMonth: parseNumber(row[costFrequencyOffset + 2], fallback.dueMonth),
          vat: parseBoolean(row[costFrequencyOffset + 3], fallback.vat),
        };
      });
    const nextAssumptions: Assumptions = {
      budgetYear: parseNumber(assumptionMap.get("budgetYear"), assumptions.budgetYear),
      startMonth: importedStartMonth,
      endMonth: importedEndMonth,
      startCash: parseNumber(assumptionMap.get("startCash"), assumptions.startCash),
      startDebt: parseNumber(assumptionMap.get("startDebt"), assumptions.startDebt),
      vatRate: parseNumber(assumptionMap.get("vatRate"), assumptions.vatRate),
      employerTaxRate: parseNumber(assumptionMap.get("employerTaxRate"), assumptions.employerTaxRate),
      insuranceRate: parseNumber(assumptionMap.get("insuranceRate"), assumptions.insuranceRate),
      vatSchedule: parseSchedule(assumptionMap.get("vatSchedule"), assumptions.vatSchedule),
      taxSchedule: parseSchedule(assumptionMap.get("taxSchedule"), assumptions.taxSchedule),
      payrollDay: parseNumber(assumptionMap.get("payrollDay"), assumptions.payrollDay),
      salaryPaidShare: parseNumber(assumptionMap.get("salaryPaidShare"), assumptions.salaryPaidShare),
      employeeTaxRate: parseNumber(assumptionMap.get("employeeTaxRate"), assumptions.employeeTaxRate),
      debtAmortization: parseNumber(assumptionMap.get("debtAmortization"), assumptions.debtAmortization),
    };

    setCustomers(nextCustomers);
    setEmployees(nextEmployees);
    setCosts(nextCosts);
    setAssumptions(nextAssumptions);
    setScenarioName(file.name.replace(/\.xlsx$/i, ""));
    setActiveScenarioId("");
    setStatusMessage(`Importerade ${file.name}.`);
  }

  function updateCustomerRevenue(customerIndex: number, monthIndex: number, value: number) {
    setCustomers((current) =>
      current.map((customer, index) =>
        index === customerIndex
          ? { ...customer, revenue: customer.revenue.map((oldValue, idx) => (idx === monthIndex ? value : oldValue)) }
          : customer,
      ),
    );
  }

  function addCustomer() {
    const nextNumber = customers.length + 1;
    setCustomers((current) => [
      ...current,
      {
        name: `Ny kund ${nextNumber}`,
        revenue: Array(periodMonths.length).fill(0) as MonthValues,
        paymentDays: 30,
        basis: "Månadsslut",
        vat: true,
      },
    ]);
    setActiveTab("revenue");
    setStatusMessage(`Lade till Ny kund ${nextNumber}.`);
  }

  function removeCustomer(customerIndex: number) {
    const customer = customers[customerIndex];
    setCustomers((current) => current.filter((_, index) => index !== customerIndex));
    setStatusMessage(customer ? `Tog bort ${customer.name}.` : "Kund borttagen.");
  }

  function updateEmployeeWorkRate(employeeIndex: number, monthIndex: number, value: number) {
    setEmployees((current) =>
      current.map((employee, index) =>
        index === employeeIndex
          ? { ...employee, workRate: employee.workRate.map((oldValue, idx) => (idx === monthIndex ? value / 100 : oldValue)) }
          : employee,
      ),
    );
  }

  function updateCostAmount(costIndex: number, monthIndex: number, value: number) {
    setCosts((current) =>
      current.map((cost, index) =>
        index === costIndex ? { ...cost, amount: cost.amount.map((oldValue, idx) => (idx === monthIndex ? value : oldValue)) } : cost,
      ),
    );
  }

  function updatePeriod(next: Partial<Pick<Assumptions, "budgetYear" | "startMonth" | "endMonth">>) {
    const nextAssumptions = { ...assumptions, ...next };
    const normalizedStart = Math.min(Math.max(Math.round(nextAssumptions.startMonth), 1), 12);
    const normalizedEnd = Math.min(Math.max(Math.round(nextAssumptions.endMonth), normalizedStart), 12);
    const normalizedAssumptions = {
      ...nextAssumptions,
      budgetYear: Math.max(2000, Math.round(nextAssumptions.budgetYear)),
      startMonth: normalizedStart,
      endMonth: normalizedEnd,
    };
    const nextLength = getPeriodMonths(normalizedAssumptions.startMonth, normalizedAssumptions.endMonth).length;
    const resized = resizeScenarioData(customers, employees, costs, nextLength);
    setAssumptions(normalizedAssumptions);
    setCustomers(resized.customers);
    setEmployees(resized.employees);
    setCosts(resized.costs);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Översikt" },
    { id: "revenue", label: "Intäkter" },
    { id: "people", label: "Personalkostnader" },
    { id: "costs", label: "Övriga kostnader" },
    { id: "cash", label: "Kassaflöde" },
  ];

  return (
    <main className="norc-app">
      <section className="norc-shell">
        <header className="norc-topbar">
          <div>
            <p className="norc-eyebrow">
              NORC budget {periodMonths[0]?.label.toLowerCase()}-{periodMonths[periodMonths.length - 1]?.label.toLowerCase()}{" "}
              {assumptions.budgetYear}
            </p>
            <h1>Budget och likviditet</h1>
          </div>
          <button
            className="norc-reset"
            type="button"
            onClick={() => {
              setCustomers(initialCustomers);
              setEmployees(initialEmployees);
              setCosts(initialCosts);
              setAssumptions(initialAssumptions);
              setScenarioName("Bas");
              setActiveScenarioId("");
              setStatusMessage("Återställde till basläge.");
            }}
          >
            Återställ
          </button>
        </header>

        <nav className="norc-tabs" aria-label="Budgetvyer">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <section className="norc-scenario-bar" aria-label="Scenario och Excel">
          <div className="norc-scenario-name">
            <label>
              Scenario
              <input value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} />
            </label>
          </div>
          <div className="norc-period-controls">
            <label>
              Budgetår
              <NumberInput value={assumptions.budgetYear} step={1} onChange={(value) => updatePeriod({ budgetYear: value })} />
            </label>
            <label>
              Startmånad
              <select value={assumptions.startMonth} onChange={(event) => updatePeriod({ startMonth: Number(event.target.value) })}>
                {monthNames.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Slutmånad
              <select value={assumptions.endMonth} onChange={(event) => updatePeriod({ endMonth: Number(event.target.value) })}>
                {monthNames.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="norc-scenario-actions">
            <button type="button" onClick={saveScenario}>
              Spara scenario
            </button>
            <select value={activeScenarioId} onChange={(event) => loadScenario(event.target.value)}>
              <option value="">Ladda scenario</option>
              {savedScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
            <button type="button" disabled={!activeScenarioId} onClick={deleteScenario}>
              Ta bort
            </button>
            <button type="button" onClick={() => void exportToExcel()}>
              Exportera Excel
            </button>
            <label className="norc-import-button">
              Importera Excel
              <input
                type="file"
                accept=".xlsx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importFromExcel(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          {statusMessage ? <p>{statusMessage}</p> : null}
        </section>

        {activeTab === "overview" ? (
          <section className="norc-view">
            <div className="norc-kpis">
              <article>
                <span>Intäkter</span>
                <strong>{formatCurrency(totalRevenue)}</strong>
              </article>
              <article>
                <span>Resultat P&L</span>
                <strong className={totalResult < 0 ? "is-danger" : ""}>{formatCurrency(totalResult)}</strong>
              </article>
              <article>
                <span>Lägsta likviditet</span>
                <strong className={minLiquidity < 0 ? "is-danger" : ""}>{formatCurrency(minLiquidity)}</strong>
              </article>
              <article>
                <span>Likviditet december</span>
                <strong className={decemberLiquidity < 0 ? "is-danger" : ""}>{formatCurrency(decemberLiquidity)}</strong>
              </article>
            </div>

            <div className="norc-grid-two">
              <section className="norc-panel">
                <div className="norc-panel-head">
                  <h2>Intäkter och kostnader</h2>
                  <span>{formatCurrency(totalResult)}</span>
                </div>
                <LineChart revenue={model.revenue} costs={model.pnlCost} periodMonths={periodMonths} />
              </section>
              <section className="norc-panel">
                <div className="norc-panel-head">
                  <h2>Resultat per månad</h2>
                  <span>{formatCurrency(sum(model.result))}</span>
                </div>
                <div className="norc-month-list">
                  {periodMonths.map((month, index) => (
                    <div key={month.label}>
                      <span>{month.label}</span>
                      <strong className={model.result[index] < 0 ? "is-danger" : ""}>{formatCurrency(model.result[index])}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="norc-credit-panel">
              <div>
                <span>Checkkreditbehov</span>
                <strong>{formatCurrency(creditNeed)}</strong>
              </div>
              <p>
                {creditNeed > 0
                  ? `För att kassan aldrig ska gå under noll behövs minst ${formatCurrency(creditNeed)} i checkkredit. Lägsta prognostiserade kassapunkt inträffar i ${creditNeedMonth}.`
                  : "Ingen checkkredit behövs i nuvarande scenario eftersom kassan aldrig går under noll."}
              </p>
            </section>

            <section className="norc-panel">
              <div className="norc-panel-head">
                <h2>Månadstabell</h2>
                <span>Direkt från appmodellen</span>
              </div>
              <MonthlySummary model={model} periodMonths={periodMonths} />
            </section>
          </section>
        ) : null}

        {activeTab === "revenue" ? (
          <section className="norc-view norc-panel">
            <div className="norc-panel-head">
              <h2>Intäkter och kundvillkor</h2>
              <div className="norc-panel-actions">
                <span>{formatCurrency(totalRevenue)}</span>
                <button type="button" onClick={addCustomer}>
                  Lägg till kund
                </button>
              </div>
            </div>
            <div className="norc-table-scroll">
              <table className="norc-table">
                <thead>
                  <tr>
                    <th>Kund</th>
                    {periodMonths.map((month) => (
                      <th key={month.label}>{month.label}</th>
                    ))}
                    <th>Dagar</th>
                    <th>Från</th>
                    <th>Moms</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, customerIndex) => (
                    <tr key={customer.name}>
                      <th>
                        <input
                          className="norc-name-input"
                          value={customer.name}
                          onChange={(event) =>
                            setCustomers((current) =>
                              current.map((item, index) =>
                                index === customerIndex ? { ...item, name: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </th>
                      {customer.revenue.map((value, monthIndex) => (
                        <td key={periodMonths[monthIndex]?.label ?? monthIndex}>
                          <NumberInput value={value} onChange={(next) => updateCustomerRevenue(customerIndex, monthIndex, next)} />
                        </td>
                      ))}
                      <td>
                        <NumberInput
                          value={customer.paymentDays}
                          step={15}
                          onChange={(value) =>
                            setCustomers((current) =>
                              current.map((item, index) => (index === customerIndex ? { ...item, paymentDays: value } : item)),
                            )
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={customer.basis}
                          onChange={(event) =>
                            setCustomers((current) =>
                              current.map((item, index) =>
                                index === customerIndex ? { ...item, basis: event.target.value as Basis } : item,
                              ),
                            )
                          }
                        >
                          <option>Månadsslut</option>
                          <option>Fakturadatum</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={customer.vat}
                          onChange={(event) =>
                            setCustomers((current) =>
                              current.map((item, index) => (index === customerIndex ? { ...item, vat: event.target.checked } : item)),
                            )
                          }
                        />
                      </td>
                      <td>
                        <button className="norc-row-action" type="button" onClick={() => removeCustomer(customerIndex)}>
                          Ta bort
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === "people" ? (
          <section className="norc-view norc-panel">
            <div className="norc-panel-head">
              <h2>Personal</h2>
              <span>{formatCurrency(sum(model.peopleCost))}</span>
            </div>
            <div className="norc-table-scroll">
              <table className="norc-table">
                <thead>
                  <tr>
                    <th>Anställd</th>
                    <th>Lön</th>
                    <th>Pension</th>
                    {periodMonths.map((month) => (
                      <th key={month.label}>{month.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, employeeIndex) => (
                    <tr key={employee.name}>
                      <th>{employee.name}</th>
                      <td>
                        <NumberInput
                          value={employee.salary}
                          onChange={(value) =>
                            setEmployees((current) =>
                              current.map((item, index) => (index === employeeIndex ? { ...item, salary: value } : item)),
                            )
                          }
                        />
                      </td>
                      <td>
                        <NumberInput
                          value={employee.pensionRate * 100}
                          suffix="%"
                          step={0.5}
                          onChange={(value) =>
                            setEmployees((current) =>
                              current.map((item, index) =>
                                index === employeeIndex ? { ...item, pensionRate: value / 100 } : item,
                              ),
                            )
                          }
                        />
                      </td>
                      {employee.workRate.map((value, monthIndex) => (
                        <td key={periodMonths[monthIndex]?.label ?? monthIndex}>
                          <NumberInput value={value * 100} suffix="%" step={5} onChange={(next) => updateEmployeeWorkRate(employeeIndex, monthIndex, next)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === "costs" ? (
          <section className="norc-view norc-panel">
            <div className="norc-panel-head">
              <h2>Kostnader och förfallon</h2>
              <span>{formatCurrency(sum(model.accruedCosts))}</span>
            </div>
            <div className="norc-table-scroll">
              <table className="norc-table">
                <thead>
                  <tr>
                    <th>Kostnad</th>
                    {periodMonths.map((month) => (
                      <th key={month.label}>{month.label}</th>
                    ))}
                    <th>Frekvens</th>
                    <th>Dag</th>
                    <th>Månad</th>
                    <th>Moms</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map((cost, costIndex) => (
                    <tr key={cost.name}>
                      <th>{cost.name}</th>
                      {cost.amount.map((value, monthIndex) => (
                        <td key={periodMonths[monthIndex]?.label ?? monthIndex}>
                          <NumberInput value={value} onChange={(next) => updateCostAmount(costIndex, monthIndex, next)} />
                        </td>
                      ))}
                      <td>
                        <select
                          value={cost.frequency}
                          onChange={(event) =>
                            setCosts((current) =>
                              current.map((item, index) =>
                                index === costIndex ? { ...item, frequency: event.target.value as Frequency } : item,
                              ),
                            )
                          }
                        >
                          <option>Månadsvis</option>
                          <option>Kvartalsvis</option>
                          <option>Halvårsvis</option>
                          <option>Årsvis</option>
                        </select>
                      </td>
                      <td>
                        <NumberInput
                          value={cost.dueDay}
                          step={1}
                          onChange={(value) =>
                            setCosts((current) =>
                              current.map((item, index) => (index === costIndex ? { ...item, dueDay: value } : item)),
                            )
                          }
                        />
                      </td>
                      <td>
                        <NumberInput
                          value={cost.dueMonth}
                          step={1}
                          onChange={(value) =>
                            setCosts((current) =>
                              current.map((item, index) => (index === costIndex ? { ...item, dueMonth: value } : item)),
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={cost.vat}
                          onChange={(event) =>
                            setCosts((current) =>
                              current.map((item, index) => (index === costIndex ? { ...item, vat: event.target.checked } : item)),
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === "cash" ? (
          <section className="norc-view">
            <div className="norc-grid-two">
              <section className="norc-panel">
                <div className="norc-panel-head">
                  <h2>Grundantaganden</h2>
                  <span>Likviditet</span>
                </div>
                <div className="norc-form-grid">
                  <label>
                    Startkapital
                    <NumberInput value={assumptions.startCash} onChange={(value) => setAssumptions({ ...assumptions, startCash: value })} />
                  </label>
                  <label>
                    Startskuld
                    <NumberInput value={assumptions.startDebt} onChange={(value) => setAssumptions({ ...assumptions, startDebt: value })} />
                  </label>
                  <label>
                    Moms
                    <NumberInput value={assumptions.vatRate * 100} suffix="%" step={1} onChange={(value) => setAssumptions({ ...assumptions, vatRate: value / 100 })} />
                  </label>
                  <label>
                    Arbetsgivaravgift
                    <NumberInput value={assumptions.employerTaxRate * 100} suffix="%" step={0.1} onChange={(value) => setAssumptions({ ...assumptions, employerTaxRate: value / 100 })} />
                  </label>
                  <label>
                    Personalförsäkring
                    <NumberInput value={assumptions.insuranceRate * 100} suffix="%" step={0.1} onChange={(value) => setAssumptions({ ...assumptions, insuranceRate: value / 100 })} />
                  </label>
                  <label>
                    Amortering per månad
                    <NumberInput value={assumptions.debtAmortization} onChange={(value) => setAssumptions({ ...assumptions, debtAmortization: value })} />
                  </label>
                </div>
              </section>
              <section className="norc-panel">
                <div className="norc-panel-head">
                  <h2>Betalningsrytmer</h2>
                  <span>{formatPercent(assumptions.vatRate)}</span>
                </div>
                <div className="norc-form-grid">
                  <label>
                    Momsredovisning
                    <select
                      value={assumptions.vatSchedule}
                      onChange={(event) => setAssumptions({ ...assumptions, vatSchedule: event.target.value as "Månadsvis" | "Kvartalsvis" })}
                    >
                      <option>Månadsvis</option>
                      <option>Kvartalsvis</option>
                    </select>
                  </label>
                  <label>
                    Skatt och AG
                    <select
                      value={assumptions.taxSchedule}
                      onChange={(event) => setAssumptions({ ...assumptions, taxSchedule: event.target.value as "Månadsvis" | "Kvartalsvis" })}
                    >
                      <option>Månadsvis</option>
                      <option>Kvartalsvis</option>
                    </select>
                  </label>
                  <label>
                    Löneutbetalningsdag
                    <NumberInput value={assumptions.payrollDay} step={1} onChange={(value) => setAssumptions({ ...assumptions, payrollDay: value })} />
                  </label>
                  <label>
                    Löneandel som betalas ut
                    <NumberInput value={assumptions.salaryPaidShare * 100} suffix="%" step={1} onChange={(value) => setAssumptions({ ...assumptions, salaryPaidShare: value / 100 })} />
                  </label>
                  <label>
                    Personalskatt på bruttolön
                    <NumberInput value={assumptions.employeeTaxRate * 100} suffix="%" step={1} onChange={(value) => setAssumptions({ ...assumptions, employeeTaxRate: value / 100 })} />
                  </label>
                </div>
              </section>
            </div>
            <section className="norc-panel">
              <div className="norc-panel-head">
                <h2>Likviditetsprognos</h2>
                <span>{formatCurrency(minLiquidity)}</span>
              </div>
              <MiniBarChart values={model.monthlyCashFlow} periodMonths={periodMonths} />
              <MonthlySummary model={model} periodMonths={periodMonths} cashOnly />
            </section>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function MonthlySummary({
  model,
  periodMonths,
  cashOnly = false,
}: {
  model: ReturnType<typeof calculateModel>;
  periodMonths: ReturnType<typeof getPeriodMonths>;
  cashOnly?: boolean;
}) {
  const rows = cashOnly
    ? [
        ["Kundinbetalningar", model.receipts],
        ["Löneutbetalningar", model.salaryPayments.map((value) => -value)],
        ["Leverantörer", model.supplierPaymentsExVat.map((value, index) => -(value + model.supplierPaymentsVat[index]))],
        ["Skatt och AG", model.taxPayments.map((value) => -value)],
        ["Momsbetalning", model.vatPayments.map((value) => -value)],
        ["Månadens kassaflöde", model.monthlyCashFlow],
        ["Utgående likviditet", model.closingCash],
      ]
    : [
        ["Intäkter", model.revenue],
        ["Personalkostnader", model.peopleCost.map((value) => -value)],
        ["Övriga kostnader", model.accruedCosts.map((value) => -value)],
        ["Resultat", model.result],
        ["Kassaflöde", model.monthlyCashFlow],
        ["Utgående likviditet", model.closingCash],
      ];
  return (
    <div className="norc-table-scroll">
      <table className="norc-table norc-summary-table">
        <thead>
          <tr>
            <th>Rad</th>
            {periodMonths.map((month) => (
              <th key={month.label}>{month.label}</th>
            ))}
            <th>Totalt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, values]) => {
            const numericValues = values as number[];
            return (
              <tr key={label as string}>
                <th>{label as string}</th>
                {numericValues.map((value, index) => (
                  <td key={periodMonths[index]?.label ?? index} className={value < 0 ? "is-danger" : ""}>
                    {formatCurrency(value)}
                  </td>
                ))}
                <td className={sum(numericValues) < 0 ? "is-danger" : ""}>{formatCurrency(sum(numericValues))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
