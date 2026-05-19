import { useState } from 'react';

import type { Category } from '@entities/category';
import type { Transaction } from '@entities/transaction';
import { CategoryCombobox } from '@features/manage-categories';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Modal } from '@shared/ui/modal';
import { Select } from '@shared/ui/select';

import { mapFormToTransaction } from '../lib/map-form-to-transaction';
import { transactionFormSchema } from '../model/transaction-form.schema';
import type { TransactionFormValues } from '../types/transaction-form-values.type';

type CreateTransactionModalProps = {
  error?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (transaction: Transaction) => Promise<boolean>;
  isCreating?: boolean;
};

const initialValues: TransactionFormValues = {
  amount: '',
  categoryId: '',
  categoryName: '',
  currency: 'UAH',
  date: new Date().toISOString().slice(0, 10),
  kind: 'expense',
  paymentMethod: '',
  comment: '',
};

export function CreateTransactionModal({
  error,
  isCreating = false,
  isOpen,
  onClose,
  onCreate,
}: CreateTransactionModalProps) {
  const [values, setValues] = useState<TransactionFormValues>(initialValues);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function selectCategory(category: Category) {
    setSelectedCategory(category);
    setValues({
      ...values,
      categoryId: category.id,
      categoryName: category.name,
    });
  }

  const visibleError = formError ?? error;

  async function submitForm() {
    setFormError(null);
    const parsedValues = transactionFormSchema.safeParse(values);

    if (!parsedValues.success) {
      setFormError(parsedValues.error.issues[0]?.message ?? 'Check transaction form.');
      return;
    }

    const transaction = mapFormToTransaction(parsedValues.data);
    const isCreated = await onCreate(transaction);

    if (isCreated) {
      setValues({
        ...initialValues,
        date: new Date().toISOString().slice(0, 10),
      });
      setSelectedCategory(null);
      onClose();
    }
  }

  return (
    <Modal
      description="Create a transaction and sync it to your Google Sheets Ledger."
      isOpen={isOpen}
      onClose={onClose}
      title="Create transaction"
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submitForm();
        }}
      >
        {visibleError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
            {visibleError}
          </div>
        ) : null}
        <Select
          id="transaction-kind"
          label="Type"
          onChange={(event) => {
            const nextKind = event.target.value as 'income' | 'expense';

            setValues({
              ...values,
              categoryId: selectedCategory?.kind === nextKind ? values.categoryId : '',
              categoryName: selectedCategory?.kind === nextKind ? values.categoryName : '',
              kind: nextKind,
            });
            setSelectedCategory((currentCategory) =>
              currentCategory?.kind === nextKind ? currentCategory : null,
            );
          }}
          value={values.kind}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="transaction-date"
            label="Date"
            onChange={(event) => setValues({ ...values, date: event.target.value })}
            type="date"
            value={values.date}
          />
          <Input
            id="transaction-currency"
            label="Currency"
            maxLength={3}
            onChange={(event) =>
              setValues({ ...values, currency: event.target.value.toUpperCase() })
            }
            placeholder="UAH"
            value={values.currency}
          />
        </div>
        <Input
          hint="Amount is stored as a positive value; signed amount is calculated automatically."
          id="transaction-amount"
          label="Amount"
          onChange={(event) => setValues({ ...values, amount: event.target.value })}
          placeholder="250"
          value={values.amount}
        />
        <CategoryCombobox kind={values.kind} onChange={selectCategory} value={selectedCategory} />
        <Input
          id="transaction-payment-method"
          label="Payment method"
          onChange={(event) => setValues({ ...values, paymentMethod: event.target.value })}
          placeholder="Card, cash, bank"
          value={values.paymentMethod}
        />
        <Input
          id="transaction-comment"
          label="Comment"
          onChange={(event) => setValues({ ...values, comment: event.target.value })}
          placeholder="Optional note"
          value={values.comment}
        />
        <div className="flex justify-end gap-2">
          <Button disabled={isCreating} onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button isLoading={isCreating} type="submit">
            Create transaction
          </Button>
        </div>
      </form>
    </Modal>
  );
}
