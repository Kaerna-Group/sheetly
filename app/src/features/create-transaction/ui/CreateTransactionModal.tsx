import { useState } from 'react';

import type { Category } from '@entities/category';
import { CategoryCombobox } from '@features/manage-categories';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Modal } from '@shared/ui/modal';
import { Select } from '@shared/ui/select';

import type { TransactionFormValues } from '../types/transaction-form-values.type';

type CreateTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const initialValues: TransactionFormValues = {
  amount: '',
  categoryId: '',
  categoryName: '',
  currency: 'UAH',
  date: new Date().toISOString().slice(0, 10),
  kind: 'expense',
};

export function CreateTransactionModal({ isOpen, onClose }: CreateTransactionModalProps) {
  const [values, setValues] = useState<TransactionFormValues>(initialValues);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  function selectCategory(category: Category) {
    setSelectedCategory(category);
    setValues({
      ...values,
      categoryId: category.id,
      categoryName: category.name,
    });
  }

  return (
    <Modal
      description="Create a local draft. Sync with Google Sheets is planned for the transactions milestone."
      isOpen={isOpen}
      onClose={onClose}
      title="Create transaction"
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
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
        <Input
          id="transaction-date"
          label="Date"
          onChange={(event) => setValues({ ...values, date: event.target.value })}
          type="date"
          value={values.date}
        />
        <Input
          hint="Amount is stored as a positive value; signed amount is calculated separately."
          id="transaction-amount"
          label="Amount"
          onChange={(event) => setValues({ ...values, amount: event.target.value })}
          placeholder="250"
          value={values.amount}
        />
        <CategoryCombobox kind={values.kind} onChange={selectCategory} value={selectedCategory} />
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button type="submit">Create draft</Button>
        </div>
      </form>
    </Modal>
  );
}
