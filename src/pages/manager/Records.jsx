import { useState } from "react";
import { MONTHS } from "../../lib/format";
import { useFaculties } from "../../lib/queries";
import { RecordsTable } from "../../components/records";
import { Input, PageHeader, Select, useDebounced } from "../../components/ui";

export default function Records() {
  const now = new Date();
  const { data: faculties = [] } = useFaculties();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState("");
  const [faculty, setFaculty] = useState("");
  const [ordering, setOrdering] = useState("");
  const [search, setSearch] = useState("");
  const staffId = useDebounced(search.trim().toUpperCase(), 350);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Payroll" title="Payslips">
        Every payslip issued, as an immutable record. Open one to see the full breakdown, or download the PDF the staff member receives.
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_0.9fr_1.3fr_1fr]">
        <Input placeholder="Exact staff ID, e.g. UI/NA/41207" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Staff ID" />
        <Select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
          <option value="">All years</option>
          {Array.from({ length: 4 }, (_, i) => now.getFullYear() - i).map((y) => <option key={y}>{y}</option>)}
        </Select>
        <Select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month">
          <option value="">All months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </Select>
        <Select value={faculty} onChange={(e) => setFaculty(e.target.value)} aria-label="Faculty">
          <option value="">All faculties & units</option>
          {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
        <Select value={ordering} onChange={(e) => setOrdering(e.target.value)} aria-label="Sort">
          <option value="">Newest period first</option>
          <option value="-net_pay">Highest net pay</option>
          <option value="net_pay">Lowest net pay</option>
        </Select>
      </div>

      <RecordsTable params={{ year, month, faculty, staff_id: staffId || undefined, ordering: ordering || undefined }} />
    </div>
  );
}
