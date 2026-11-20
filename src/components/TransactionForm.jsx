
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { api, errorMessage } from "../services/api";
import { Field, Modal, Notice } from "./UI";
import { money, packs } from "../utils/format";

// Create a new empty fruit item
const newItem = () => ({
    fruit_id: "",
    packaging_size: "SMALL",
    quantity: 1,
    unit_cost: ""
});

export default function TransactionForm({
    type,
    onClose,
    onSaved,
    suppliers = [],
    vendors = [],
    fruits = [],
    inventory = []
}) {
    // Determine transaction type
    const purchase = type === "purchase";

    // Form states
    const [person, setPerson] = useState("");
    const [items, setItems] = useState([newItem()]);

    const [method, setMethod] = useState("CASH");
    const [paid, setPaid] = useState("0");

    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    // Get selling price based on fruit and package size
    const selectedPrice = (item) => {
        const fruit = fruits.find(
            (f) => String(f.fruit_id) === String(item.fruit_id)
        );

        const priceField =
            item.packaging_size.toLowerCase() + "_price";

        return Number(fruit?.[priceField] || 0);
    };

    // Automatically calculate total amount
    const total = useMemo(() => {
        return items.reduce((sum, item) => {
            const quantity = Number(item.quantity) || 0;

            const price = purchase
                ? Number(item.unit_cost) || 0
                : selectedPrice(item);

            return sum + quantity * price;
        }, 0);
    }, [items, fruits, purchase]);

    // Update an item
    const changeItem = (index, key, value) => {
        setItems((previous) =>
            previous.map((item, i) =>
                i === index
                    ? { ...item, [key]: value }
                    : item
            )
        );
    };

    // Select suppliers for purchases or vendors for sales
    const options = purchase ? suppliers : vendors;

    // Calculate outstanding balance
    const outstanding = Math.max(
        0,
        total - (Number(paid) || 0)
    );

    // Submit purchase or sale
    async function submit(e) {
        e.preventDefault();

        setError("");

        // Validate supplier or vendor
        if (!person) {
            setError(
                `Choose a ${purchase ? "supplier" : "vendor"}.`
            );
            return;
        }

        // Validate fruit items
        if (
            items.some(
                (item) =>
                    !item.fruit_id ||
                    !Number.isSafeInteger(Number(item.quantity)) ||
                    Number(item.quantity) <= 0
            )
        ) {
            setError(
                "Choose a fruit and positive whole-number quantity for every item."
            );
            return;
        }

        // Prevent duplicate fruit/package combinations
        const keys = items.map(
            (item) =>
                item.fruit_id + "-" + item.packaging_size
        );

        if (new Set(keys).size !== keys.length) {
            setError(
                "Each fruit and packaging size must appear only once."
            );
            return;
        }

        // Validate purchase costs
        if (
            purchase &&
            items.some(
                (item) =>
                    !Number.isFinite(Number(item.unit_cost)) ||
                    Number(item.unit_cost) <= 0
            )
        ) {
            setError(
                "Enter a positive unit cost for every purchase item."
            );
            return;
        }

        // Validate selling prices
        if (
            !purchase &&
            items.some((item) => selectedPrice(item) <= 0)
        ) {
            setError(
                "One or more selected fruits do not have a valid selling price."
            );
            return;
        }

        // Validate payment amount
        if (
            !purchase &&
            (
                paid.trim() === "" ||
                !Number.isFinite(Number(paid)) ||
                Number(paid) < 0 ||
                Number(paid) > total
            )
        ) {
            setError(
                "Amount paid must be between zero and the sale total."
            );
            return;
        }

        setBusy(true);

        try {
            // Prepare data for backend
            const payload = {
                ...(purchase
                    ? {
                        supplier_id: Number(person)
                    }
                    : {
                        vendor_id: Number(person),
                        payment_method: method,
                        amount_paid: Number(paid)
                    }),

                items: items.map((item) => ({
                    fruit_id: Number(item.fruit_id),

                    packaging_size: item.packaging_size,

                    quantity: Number(item.quantity),

                    ...(purchase
                        ? {
                            unit_cost: Number(item.unit_cost)
                        }
                        : {})
                }))
            };

            // Send data to Express API
            await api.post(
                purchase ? "/purchases" : "/sales",
                payload
            );

            // Refresh application records
            await onSaved?.();

            // Close form
            onClose();

        } catch (err) {
            setError(errorMessage(err));

        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal
            title={
                purchase
                    ? "Record new purchase"
                    : "Record new sale"
            }
            onClose={onClose}
            wide
        >
            <form className="form" onSubmit={submit}>

                <Notice>{error}</Notice>

                {/* Supplier or Vendor */}
                <Field
                    label={purchase ? "Supplier" : "Vendor"}
                    required
                >
                    <select
                        value={person}
                        onChange={(e) =>
                            setPerson(e.target.value)
                        }
                        required
                    >
                        <option value="">
                            Select {purchase ? "supplier" : "vendor"}
                        </option>

                        {options.map((personOption) => (
                            <option
                                key={
                                    purchase
                                        ? personOption.supplier_id
                                        : personOption.vendor_id
                                }
                                value={
                                    purchase
                                        ? personOption.supplier_id
                                        : personOption.vendor_id
                                }
                            >
                                {purchase
                                    ? personOption.business_name
                                    : personOption.vendor_name}
                            </option>
                        ))}
                    </select>
                </Field>

                {/* Fruit items heading */}
                <div className="line-items-heading">
                    <h3>Fruit items</h3>

                    <button
                        className="secondary-btn small"
                        type="button"
                        onClick={() =>
                            setItems((previous) => [
                                ...previous,
                                newItem()
                            ])
                        }
                    >
                        <Plus size={16} />
                        Add line
                    </button>
                </div>

                {/* Fruit items */}
                {items.map((item, index) => (
                    <div className="line-item" key={index}>

                        <div className="line-item-number">
                            Item {index + 1}
                        </div>

                        <div className="item-grid">

                            {/* Fruit selection */}
                            <Field label="Fruit" required>
                                <select
                                    required
                                    value={item.fruit_id}
                                    onChange={(e) =>
                                        changeItem(
                                            index,
                                            "fruit_id",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Select fruit
                                    </option>

                                    {fruits
                                        .filter(
                                            (fruit) =>
                                                fruit.status === "ACTIVE"
                                        )
                                        .map((fruit) => (
                                            <option
                                                key={fruit.fruit_id}
                                                value={fruit.fruit_id}
                                            >
                                                {fruit.fruit_name}
                                            </option>
                                        ))}
                                </select>
                            </Field>

                            {/* Packaging size */}
                            <Field label="Package" required>
                                <select
                                    value={item.packaging_size}
                                    onChange={(e) =>
                                        changeItem(
                                            index,
                                            "packaging_size",
                                            e.target.value
                                        )
                                    }
                                >
                                    {packs.map((pack) => (
                                        <option
                                            key={pack}
                                            value={pack}
                                        >
                                            {pack}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {/* Quantity */}
                            <Field label="Boxes" required>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    value={item.quantity}
                                    onChange={(e) =>
                                        changeItem(
                                            index,
                                            "quantity",
                                            e.target.value
                                        )
                                    }
                                />
                            </Field>

                            {/* Purchase cost */}
                            {purchase ? (
                                <Field
                                    label="Cost per box (M)"
                                    required
                                >
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={item.unit_cost}
                                        onChange={(e) =>
                                            changeItem(
                                                index,
                                                "unit_cost",
                                                e.target.value
                                            )
                                        }
                                    />
                                </Field>
                            ) : (
                                <div className="line-price">
                                    <span>Unit price</span>

                                    <strong>
                                        {money(selectedPrice(item))}
                                    </strong>

                                    <small>
                                        In stock: {
                                            inventory.find(
                                                (stock) =>
                                                    String(stock.fruit_id) ===
                                                        String(item.fruit_id) &&
                                                    stock.packaging_size ===
                                                        item.packaging_size
                                            )?.available_quantity ?? 0
                                        }
                                    </small>
                                </div>
                            )}

                        </div>

                        {/* Item total */}
                        <div className="item-bottom">
                            <span>
                                Line total{" "}
                                <strong>
                                    {money(
                                        (Number(item.quantity) || 0) *
                                        (
                                            purchase
                                                ? Number(item.unit_cost) || 0
                                                : selectedPrice(item)
                                        )
                                    )}
                                </strong>
                            </span>

                            <button
                                className="icon-btn danger-text"
                                type="button"
                                title="Remove item"
                                disabled={items.length === 1}
                                onClick={() =>
                                    setItems((previous) =>
                                        previous.filter(
                                            (_, i) => i !== index
                                        )
                                    )
                                }
                            >
                                <Trash2 size={17} />
                            </button>
                        </div>

                    </div>
                ))}

                {/* Sales payment section */}
                {!purchase && (
                    <div className="form-grid">

                        {/* Payment method */}
                        <Field label="Payment method" required>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}>
                            <option value="MPESA">M-Pesa</option>
                            <option value="ECOCASH">EcoCash</option>
                            <option value="CASH">Cash</option>
                            <option value="CARD_BANK">Card/Bank</option>
                            <option value="CREDIT">Credit</option>
                        </select>
                        </Field>

                        {/* Amount paid */}
                        <Field label="Amount paid (M)" required>
                            <input
                                type="number"
                                min="0"
                                max={total}
                                step="0.01"
                                required
                                value={paid}
                                onChange={(e) =>
                                    setPaid(e.target.value)
                                }
                            />
                        </Field>

                    </div>
                )}

                {/* Transaction total */}
                <div className="total-box">
                    <span>
                        {purchase
                            ? "Purchase total"
                            : "Sale total"}
                    </span>

                    <strong>
                        {money(total)}
                    </strong>

                    {!purchase && (
                        <small>
                            Outstanding: {money(outstanding)}
                        </small>
                    )}
                </div>

                {/* Form buttons */}
                <div className="modal-actions">

                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={busy}
                        className="primary-btn"
                    >
                        {busy
                            ? "Saving..."
                            : purchase
                                ? "Record purchase"
                                : "Complete sale"}
                    </button>

                </div>

            </form>
        </Modal>
    );
}



