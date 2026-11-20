import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Boxes,
  Bolt,
  CircleDollarSign,
  Clock3,
  PackagePlus,
  ShoppingCart,
  Truck,
  Users,
  Apple,
  PieChart,
  BarChart3
} from 'lucide-react';
import { useRemote, Notice } from '../components/UI';
import { money, dateText, qty } from '../utils/format';
import heroProduce from '../assets/produce-hero.png';

const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function safeList(data) {
  return Array.isArray(data) ? data : [];
}

function salesSeries(rows) {
  const base = dayKeys.map((label) => ({ label, value: 0 }));
  rows.forEach((sale) => {
    const date = new Date(sale.sale_date);
    if (Number.isNaN(date.getTime())) return;
    const label = dayIndex[date.getDay()];
    const point = base.find((d) => d.label === label);
    if (point) point.value += Number(sale.total_amount || 0);
  });
  return base;
}

function pieMix(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const name = r.fruit_name || 'Unknown';
    map.set(name, (map.get(name) || 0) + Number(r.total_boxes_sold || 0));
  });
  const total = [...map.values()].reduce((sum, value) => sum + value, 0);
  const palette = ['#0f4c75', '#3282b8', '#4ea6da', '#8ccff0', '#bbe1fa'];
  return [...map.entries()].slice(0, 5).map(([name, value], index) => ({
    name,
    value,
    percent: total ? (value / total) * 100 : 0,
    color: palette[index % palette.length]
  }));
}

function donutStyle(items) {
  if (!items.length) return { background: '#dbe8f2' };
  let current = 0;
  const segments = items.map((item) => {
    const start = current;
    current += item.percent;
    return `${item.color} ${start}% ${current}%`;
  });
  return { background: `conic-gradient(${segments.join(', ')})` };
}

export default function Dashboard() {
  const suppliers = useRemote('/suppliers');
  const vendors = useRemote('/vendors');
  const fruits = useRemote('/fruits');
  const stock = useRemote('/stock');
  const sales = useRemote('/sales');
  const reportsTop = useRemote('/reports/top-fruits');
  const purchases = useRemote('/purchases');

  const supplierRows = safeList(suppliers.data);
  const vendorRows = safeList(vendors.data);
  const fruitRows = safeList(fruits.data);
  const stockRows = safeList(stock.data);
  const salesRows = safeList(sales.data);
  const purchaseRows = safeList(purchases.data);
  const topRows = safeList(reportsTop.data);

  const errors = [suppliers, vendors, fruits, stock, sales, reportsTop, purchases]
    .filter((x) => x.error)
    .map((x) => x.error);

  const salesTotal = salesRows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const boxTotal = stockRows.reduce((sum, row) => sum + Number(row.available_quantity || 0), 0);
  const barData = salesSeries(salesRows);
  const maxBar = Math.max(...barData.map((d) => d.value), 1);
  const mixData = pieMix(topRows);

  const stockWatch = topRows.map((fruit) => {
    const totalBoxes = stockRows
      .filter((row) => row.fruit_id === fruit.fruit_id)
      .reduce((sum, row) => sum + Number(row.available_quantity || 0), 0);
    return {
      fruit_name: fruit.fruit_name,
      available_quantity: totalBoxes
    };
  });

  const maxStock = Math.max(...stockWatch.map((d) => d.available_quantity), 1);

  const transactions = [
    ...salesRows.map((row) => ({
      type: 'Sale',
      reference: `SAL-${String(row.sale_id).padStart(4, '0')}`,
      party: row.vendor_name,
      date: row.sale_date,
      amount: row.total_amount,
      status: row.payment_status || 'PAID'
    })),
    ...purchaseRows.map((row) => ({
      type: 'Purchase',
      reference: `PUR-${String(row.purchase_id).padStart(4, '0')}`,
      party: row.business_name,
      date: row.purchase_date,
      amount: row.total_amount,
      status: 'COMPLETED'
    }))
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const activityItems = transactions.slice(0, 3).map((item) => ({
    ...item,
    title:
      item.type === 'Purchase'
        ? 'Stock received'
        : item.type === 'Sale'
          ? 'Sale recorded'
          : 'Activity posted'
  }));

  const metrics = [
    { label: 'Produce types', value: qty(fruitRows.length), icon: Apple },
    { label: 'Supply partners', value: qty(supplierRows.length), icon: Truck },
    { label: 'Vendors', value: qty(vendorRows.length), icon: Users },
    { label: 'Boxes available', value: qty(boxTotal), icon: Box }
  ];

  return (
    <div className="ops-dashboard">
      {errors.length > 0 && (
        <Notice>
          Some dashboard data could not load. Ensure your backend and MySQL are running. {errors[0]}
        </Notice>
      )}

      <div className="ops-grid-top">
        <section className="ops-hero-card">
          <div className="ops-hero-copy">
            <span className="ops-hero-kicker">FARM DISTRIBUTION HUB</span>
            <h2>Operations overview</h2>
            <p>Manage and track produce distribution from farms to market.</p>
          </div>
          <img src={heroProduce} alt="Fruit produce illustration" className="ops-hero-image" />
        </section>

        <div className="ops-side-stack">
          <section className="ops-quick-card">
            <div className="ops-card-title-row">
              <div>
                <h3><Bolt size={18} /> Quick actions</h3>
                <p>Get key operations done quickly.</p>
              </div>
            </div>
            <div className="ops-quick-actions">
              <Link to="/sales" className="ops-action-button primary">
                <CircleDollarSign size={18} />
                <span>Record Sale</span>
                <ArrowRight size={17} />
              </Link>
              <Link to="/purchases" className="ops-action-button secondary">
                <PackagePlus size={18} />
                <span>Receive Stock</span>
                <ArrowRight size={17} />
              </Link>
            </div>
          </section>

          <section className="ops-stock-card">
            <div className="ops-card-title-row">
              <div>
                <h3><Boxes size={18} /> Stock watch</h3>
                <p>Current inventory by produce (total boxes)</p>
              </div>
            </div>
            <div className="ops-stock-list">
              {stockWatch.map((item) => (
                <div key={item.fruit_name} className="ops-stock-row">
                  <div className="ops-stock-row-top">
                    <span>{item.fruit_name}</span>
                    <strong>{qty(item.available_quantity)} boxes</strong>
                  </div>
                  <div className="ops-stock-bar">
                    <span style={{ width: `${(item.available_quantity / maxStock) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="ops-metric-row">
        {metrics.map(({ label, value, icon: Icon }) => (
          <section key={label} className="ops-metric-card">
            <div className="ops-metric-icon"><Icon size={24} /></div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </section>
        ))}
      </div>

      <div className="ops-grid-bottom">
        <section className="ops-panel ops-chart-panel">
          <div className="ops-panel-head">
            <div>
              <h3><BarChart3 size={18} /> Weekly sales</h3>
              <p>Total sales value for the week</p>
            </div>
          </div>
          <div className="ops-bar-chart">
            {barData.map((item) => (
              <div className="ops-bar-item" key={item.label}>
                <span className="ops-bar-value">{item.value ? money(item.value).replace('M ', 'M') : 'M0'}</span>
                <div className="ops-bar-track">
                  <div className="ops-bar-fill" style={{ height: `${Math.max((item.value / maxBar) * 100, item.value ? 12 : 6)}%` }} />
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel ops-mix-panel">
          <div className="ops-panel-head">
            <div>
              <h3><PieChart size={18} /> Produce sales mix</h3>
              <p>Top-selling produce from reports</p>
            </div>
          </div>
          <div className="ops-mix-body">
            <div className="ops-donut" style={donutStyle(mixData)}>
              <div className="ops-donut-center">
                <strong>{money(salesTotal)}</strong>
                <span>Total sales</span>
              </div>
            </div>
            <div className="ops-mix-legend">
              {mixData.map((item) => (
                <div className="ops-legend-item" key={item.name}>
                  <span className="ops-legend-left">
                    <i style={{ background: item.color }} />
                    {item.name}
                  </span>
                  <strong>{item.percent.toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ops-panel ops-transactions-panel">
          <div className="ops-panel-head">
            <div>
              <h3><ShoppingCart size={18} /> Recent transactions</h3>
              <p>Latest purchase and sales activity</p>
            </div>
          </div>
          <div className="ops-mini-table-wrap">
            <table className="ops-mini-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Party</th>
                  <th>Date & Time</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr key={item.reference}>
                    <td><span className={`ops-type-pill ${item.type === 'Sale' ? 'sale' : 'purchase'}`}>{item.type}</span></td>
                    <td>{item.reference}</td>
                    <td>{item.party}</td>
                    <td>{dateText(item.date)}</td>
                    <td>{money(item.amount)}</td>
                    <td><span className={`ops-status-pill ${String(item.status).toLowerCase().replaceAll('_', '-')}`}>{String(item.status).replaceAll('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ops-panel ops-activity-panel">
          <div className="ops-panel-head">
            <div>
              <h3><Clock3 size={18} /> Activity & insights</h3>
              <p>Key updates from your distribution operations.</p>
            </div>
          </div>
          <div className="ops-timeline">
            {activityItems.map((item, index) => (
              <div className="ops-timeline-item" key={`${item.reference}-${index}`}>
                <span className="ops-timeline-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{money(item.amount)} • {item.party}</p>
                </div>
                <small>{dateText(item.date)}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
