
import { useState } from "react";
import { Plus, Eye, Wallet } from "lucide-react";

import { api, errorMessage } from "../services/api";

import {
    useRemote,
    PageHeader,
    Table,
    Modal,
    Notice,
    Field,
    Status
} from "../components/UI";

import TransactionForm from "../components/TransactionForm";

import { money, dateText } from "../utils/format";

export default function Sales() {

    // ========================================
    // FETCH DATABASE RECORDS
    // ========================================

    const list = useRemote("/sales");
    const vendors = useRemote("/vendors");
    const fruits = useRemote("/fruits");
    const stock = useRemote("/stock");

    // ========================================
    // COMPONENT STATES
    // ========================================

    const [adding, setAdding] = useState(false);

    const [detail, setDetail] = useState(null);

    const [payment, setPayment] = useState(null);

    const [amount, setAmount] = useState("");

    const [method, setMethod] = useState("CASH");

    const [busy, setBusy] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    // ========================================
    // VIEW SALE DETAILS
    // ========================================

    async function view(id) {

        setError("");

        try {

            const response = await api.get("/sales/" + id);

            setDetail(response.data);

        } catch (err) {

            setError(errorMessage(err));

        }
    }

    // ========================================
    // OPEN PAYMENT FORM
    // ========================================

    function openPayment(sale) {

        setPayment(sale);

        setAmount("");

        setMethod("CASH");

        setError("");

        setSuccess("");
    }

    // ========================================
    // CLOSE PAYMENT FORM
    // ========================================

    function closePayment() {

        if (busy) {
            return;
        }

        setPayment(null);

        setAmount("");

        setMethod("CASH");

        setError("");
    }

    // ========================================
    // RECORD PAYMENT
    // ========================================

    async function pay(e) {

        e.preventDefault();

        if (!payment || busy) {
            return;
        }

        setError("");

        const paymentAmount = Number(amount);

        const outstandingBalance = Number(
            payment.outstanding_balance
        );

        // Validate payment amount
        if (
            amount.trim() === "" ||
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0
        ) {

            setError(
                "Please enter a valid payment amount greater than zero."
            );

            return;
        }

        // Prevent overpayment
        if (paymentAmount > outstandingBalance) {

            setError(
                "Payment amount cannot exceed the outstanding balance."
            );

            return;
        }

        // Allowed payment methods
        const allowedMethods = [
            "MPESA",
            "ECOCASH",
            "CASH",
            "CARD_BANK"
        ];

        if (!allowedMethods.includes(method)) {

            setError("Please select a valid payment method.");

            return;
        }

        setBusy(true);

        try {

            // Send payment details to Express backend
            await api.post(
                "/sales/" + payment.sale_id + "/payments",
                {
                    amount: paymentAmount,
                    payment_method: method
                }
            );

            const paidSaleId = payment.sale_id;

            // Close payment modal
            setPayment(null);

            setAmount("");

            setMethod("CASH");

            // Refresh sales list
            await list.refresh();

            // Refresh sale details if currently displayed
            if (
                detail &&
                detail.sale_id === paidSaleId
            ) {

                await view(paidSaleId);

            }

            setSuccess("Payment recorded successfully.");

        } catch (err) {

            setError(errorMessage(err));

        } finally {

            setBusy(false);

        }
    }

    // ========================================
    // PAGE INTERFACE
    // ========================================

    return (
        <>

            {/* PAGE HEADER */}

            <PageHeader
                eyebrow="ORDER FULFILLMENT / OUTBOUND"
                title="Sales & payments"
                description="Sell fruits to vendors, prevent overselling, and manage outstanding payments."
                action={
                    <button
                        className="primary-btn"
                        onClick={() => setAdding(true)}
                    >
                        <Plus size={17} />
                        New sale
                    </button>
                }
            />

            {/* SUCCESS MESSAGE */}

            <Notice
                type="success"
                onClose={() => setSuccess("")}
            >
                {success}
            </Notice>

            {/* ERROR MESSAGE */}

            {!payment && (
                <Notice>{error}</Notice>
            )}

            {/* ========================================
                SALES HISTORY
            ======================================== */}

            <section className="panel">

                <div className="panel-head">

                    <div>

                        <h2>Sales history</h2>

                        <p>
                            Sales totals and vendor payment status
                        </p>

                    </div>

                </div>

                <Table
                    rows={list.data}
                    loading={list.loading}
                    error={list.error}
                    onRetry={list.refresh}
                    columns={[

                        {
                            key: "sale_id",
                            label: "Sale #",
                            render: (row) => "#" + row.sale_id
                        },

                        {
                            key: "vendor_name",
                            label: "Vendor"
                        },

                        {
                            key: "sale_date",
                            label: "Date",
                            render: (row) =>
                                dateText(row.sale_date)
                        },

                        {
                            key: "total_amount",
                            label: "Total",
                            render: (row) =>
                                money(row.total_amount)
                        },

                        {
                            key: "payment_status",
                            label: "Payment",
                            render: (row) => (
                                <Status
                                    value={row.payment_status}
                                />
                            )
                        },

                        {
                            key: "outstanding_balance",
                            label: "Outstanding",
                            render: (row) => (
                                <strong>
                                    {money(row.outstanding_balance)}
                                </strong>
                            )
                        },

                        {
                            key: "actions",
                            label: "Actions",

                            render: (row) => (

                                <div className="actions">

                                    {/* VIEW SALE */}

                                    <button
                                        className="secondary-btn small"
                                        onClick={() =>
                                            view(row.sale_id)
                                        }
                                    >
                                        <Eye size={15} />
                                        View
                                    </button>

                                    {/* RECORD PAYMENT */}

                                    {Number(
                                        row.outstanding_balance
                                    ) > 0 && (

                                        <button
                                            className="secondary-btn small"
                                            onClick={() =>
                                                openPayment(row)
                                            }
                                        >
                                            <Wallet size={15} />
                                            Pay
                                        </button>

                                    )}

                                </div>

                            )
                        }

                    ]}
                />

            </section>

            {/* ========================================
                CREATE NEW SALE
            ======================================== */}

            {adding && (

                <TransactionForm
                    type="sale"
                    onClose={() => setAdding(false)}
                    vendors={vendors.data || []}
                    fruits={fruits.data || []}
                    inventory={stock.data || []}
                    onSaved={() => {

                        list.refresh();

                        stock.refresh();

                        setSuccess(
                            "Sale recorded and inventory updated."
                        );

                    }}
                />

            )}

            {/* ========================================
                VIEW SALE DETAILS MODAL
            ======================================== */}

            {detail && (

                <Modal
                    title={"Sale #" + detail.sale_id}
                    wide
                    onClose={() => setDetail(null)}
                >

                    <div className="detail-meta">

                        <span>
                            Vendor: {detail.vendor_name}
                        </span>

                        <span>
                            Date: {dateText(detail.sale_date)}
                        </span>

                        <Status
                            value={detail.payment_status}
                        />

                    </div>

                    <Table
                        rows={detail.items || []}
                        columns={[

                            {
                                key: "fruit_name",
                                label: "Fruit"
                            },

                            {
                                key: "packaging_size",
                                label: "Package"
                            },

                            {
                                key: "quantity",
                                label: "Boxes"
                            },

                            {
                                key: "unit_price",
                                label: "Unit price",
                                render: (row) =>
                                    money(row.unit_price)
                            },

                            {
                                key: "line",
                                label: "Line total",
                                render: (row) =>
                                    money(
                                        Number(row.quantity) *
                                        Number(row.unit_price)
                                    )
                            }

                        ]}
                    />

                    <div className="total-box">

                        <span>
                            Total: {money(detail.total_amount)}
                        </span>

                        <strong>
                            Outstanding: {
                                money(detail.outstanding_balance)
                            }
                        </strong>

                    </div>

                </Modal>

            )}

            {/* ========================================
                RECORD PAYMENT MODAL
            ======================================== */}

            {payment && (

                <Modal
                    title={
                        "Record payment for sale #" +
                        payment.sale_id
                    }
                    onClose={closePayment}
                >

                    <form
                        className="form"
                        onSubmit={pay}
                    >

                        {/* ERROR MESSAGE */}

                        <Notice>{error}</Notice>

                        {/* OUTSTANDING BALANCE */}

                        <p className="hint">

                            Outstanding balance:{" "}

                            <strong>
                                {money(
                                    payment.outstanding_balance
                                )}
                            </strong>

                        </p>

                        {/* PAYMENT AMOUNT */}

                        <Field
                            label="Payment amount (M)"
                            required
                        >

                            <input
                                autoFocus
                                type="number"
                                required
                                step="0.01"
                                min="0.01"
                                max={Number(
                                    payment.outstanding_balance
                                )}
                                value={amount}
                                onChange={(e) =>
                                    setAmount(e.target.value)
                                }
                            />

                        </Field>

                        {/* PAYMENT METHOD */}

                        <Field
                            label="Payment method"
                            required
                        >

                            <select
                                value={method}
                                onChange={(e) =>
                                    setMethod(e.target.value)
                                }
                                required
                            >

                                <option value="MPESA">
                                    M-Pesa
                                </option>

                                <option value="ECOCASH">
                                    EcoCash
                                </option>

                                <option value="CASH">
                                    Cash
                                </option>

                                <option value="CARD_BANK">
                                    Card/Bank
                                </option>

                            </select>

                        </Field>

                        {/* FORM BUTTONS */}

                        <div className="modal-actions">

                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={closePayment}
                                disabled={busy}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={busy}
                            >
                                {busy
                                    ? "Recording..."
                                    : "Record payment"}
                            </button>

                        </div>

                    </form>

                </Modal>

            )}

        </>
    );
}
