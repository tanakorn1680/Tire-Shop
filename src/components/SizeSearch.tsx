import { site } from "@/site.config";

function Sel({ name, label, opts, val, fmt }: {
  name: string; label: string; opts: number[]; val?: string; fmt?: (o: number) => string;
}) {
  return (
    <label>{label}
      <select name={name} defaultValue={val ?? ""}>
        <option value="">ทั้งหมด</option>
        {opts.map((o) => <option key={o} value={o}>{fmt ? fmt(o) : o}</option>)}
      </select>
    </label>
  );
}

export default function SizeSearch({ w, a, r }: { w?: string; a?: string; r?: string }) {
  return (
    <div className="search">
      <h2>ค้นหายางตามขนาด</h2>
      <form action="/products">
        <Sel name="w" label="กว้าง (mm)" opts={site.sizes.width} val={w} />
        <Sel name="a" label="ซีรีย์ (%)" opts={site.sizes.aspect} val={a} />
        <Sel name="r" label="วงล้อ (นิ้ว)" opts={site.sizes.rim} val={r} fmt={(o) => `R${o}`} />
        <button className="btn btn-dark" type="submit">🔍 ค้นหา</button>
      </form>
    </div>
  );
}
