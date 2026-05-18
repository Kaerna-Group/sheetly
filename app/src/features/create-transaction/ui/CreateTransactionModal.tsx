import { useState } from 'react';

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
  categoryName: '',
  currency: 'UAH',
  date: new Date().toISOString().slice(0, 10),
  kind: 'expense',
};

export function CreateTransactionModal({ isOpen, onClose }: CreateTransactionModalProps) {
  const [values, setValues] = useState<TransactionFormValues>(initialValues);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create transaction">
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
          onChange={(event) =>
            setValues({ ...values, kind: event.target.value as 'income' | 'expense' })
          }
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
          id="transaction-amount"
          label="Amount"
          onChange={(event) => setValues({ ...values, amount: event.target.value })}
          placeholder="250"
          value={values.amount}
        />
        <Input
          id="transaction-category"
          label="Category"
          onChange={(event) => setValues({ ...values, categoryName: event.target.value })}
          placeholder="Food"
          value={values.categoryName}
        />
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
