import {Routes,Route} from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Fruits from './pages/Fruits';
import Vendors from './pages/Vendors';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
export default function App(){return <Routes><Route element={<Layout/>}><Route index element={<Dashboard/>}/><Route path="suppliers" element={<Suppliers/>}/><Route path="fruits" element={<Fruits/>}/><Route path="vendors" element={<Vendors/>}/><Route path="purchases" element={<Purchases/>}/><Route path="sales" element={<Sales/>}/><Route path="inventory" element={<Inventory/>}/><Route path="reports" element={<Reports/>}/><Route path="*" element={<Dashboard/>}/></Route></Routes>}
