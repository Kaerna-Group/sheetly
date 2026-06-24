import { useState } from 'react';

import type { Category } from '@entities/category';
import type { Container } from '@entities/container';
import type { Transaction } from '@entities/transaction';
import { CategoryCombobox } from '@features/manage-categories';
import { ContainerCombobox } from '@features/manage-containers';
import { CurrencySelect } from '@features/manage-currencies';
import { Button } from '@shared/ui/button';
import { DatePicker } from '@shared/ui/date-picker';
import { Input } from '@shared/ui/input';
import { localStorageService } from '@shared/lib/storage/local-storage.service';
import { Modal } from '@shared/ui/modal';
import { Select } from '@shared/ui/select';

import { mapFormToTransaction } from '../lib/map-form-to-transaction';
import { createTransactionFormSchema } from '../model/transaction-form.schema';
import type { TransactionFormValues } from '../types/transaction-form-values.type';

type CreateTransactionModalProps = {
  error?: string | null;
  containersEnabled?: boolean;
  initialTransaction?: Transaction | null;
  initialContainer?: Container | null;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (transaction: Transaction) => Promise<boolean>;
  isCreating?: boolean;
  mode?: 'create' | 'edit';
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
  containerId: '',
  containerName: '',
};

const amountPresets = ['50', '100', '250', '500', '1000'];

function getLastCategoryValues(kind: 'income' | 'expense') {
  const prefix = kind === 'income' ? 'Income' : 'Expense';

  return {
    id: localStorageService.get(`lastSelected${prefix}CategoryId`),
    name: localStorageService.get(`lastSelected${prefix}CategoryName`),
  };
}

function setLastCategoryValues(category: Category) {
  const prefix = category.kind === 'income' ? 'Income' : 'Expense';

  localStorageService.set(`lastSelected${prefix}CategoryId`, category.id);
  localStorageService.set(`lastSelected${prefix}CategoryName`, category.name);
}

function getCreateInitialValues(initialContainer: Container | null): TransactionFormValues {
  const kind = initialValues.kind;
  const lastCategory = getLastCategoryValues(kind);

  return {
    ...initialValues,
    categoryId: lastCategory.id ?? '',
    categoryName: lastCategory.name ?? '',
    containerId: initialContainer?.id ?? '',
    containerName: initialContainer?.name ?? '',
    currency:
      initialContainer?.currency ?? localStorageService.get('currency') ?? initialValues.currency,
    date: localStorageService.get('lastTransactionDate') ?? new Date().toISOString().slice(0, 10),
    paymentMethod: localStorageService.get('lastPaymentMethod') ?? '',
  };
}

function mapTransactionToFormValues(transaction: Transaction): TransactionFormValues {
  return {
    amount: String(transaction.amount),
    categoryId: transaction.categoryId,
    categoryName: transaction.categoryName,
    comment: transaction.comment ?? '',
    containerId: transaction.containerId ?? '',
    containerName: transaction.containerName ?? '',
    currency: transaction.currency,
    date: transaction.date,
    kind: transaction.kind,
    paymentMethod: transaction.paymentMethod ?? '',
  };
}

export function CreateTransactionModal({
  containersEnabled = false,
  error,
  initialContainer = null,
  initialTransaction = null,
  isCreating = false,
  isOpen,
  mode = 'create',
  onClose,
  onCreate,
}: CreateTransactionModalProps) {
  const [values, setValues] = useState<TransactionFormValues>(() =>
    initialTransaction
      ? mapTransactionToFormValues(initialTransaction)
      : getCreateInitialValues(initialContainer),
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(() =>
    initialTransaction
      ? {
          color: '#6366f1',
          icon: 'tag',
          id: initialTransaction.categoryId,
          isDefault: false,
          kind: initialTransaction.kind,
          name: initialTransaction.categoryName,
        }
      : values.categoryId && values.categoryName
        ? {
            color: '#6366f1',
            icon: 'tag',
            id: values.categoryId,
            isDefault: false,
            kind: values.kind,
            name: values.categoryName,
          }
        : null,
  );
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(() =>
    initialTransaction?.containerId && initialTransaction.containerName
      ? {
          color: '#6366f1',
          createdAt: initialTransaction.createdAt,
          currency: initialTransaction.currency,
          icon: 'wallet',
          id: initialTransaction.containerId,
          isDefault: false,
          name: initialTransaction.containerName,
        }
      : initialContainer,
  );
  const [formError, setFormError] = useState<string | null>(null);

  function selectCategory(category: Category) {
    setSelectedCategory(category);
    setValues({
      ...values,
      categoryId: category.id,
      categoryName: category.name,
    });
  }

  function selectContainer(container: Container) {
    setSelectedContainer(container);
    setValues({
      ...values,
      containerId: container.id,
      containerName: container.name,
      currency: container.currency,
    });
  }

  const visibleError = formError ?? error;

  async function submitForm() {
    setFormError(null);
    const parsedValues = createTransactionFormSchema(containersEnabled).safeParse(values);

    if (!parsedValues.success) {
      setFormError(parsedValues.error.issues[0]?.message ?? 'Check transaction form.');
      return;
    }

    const mappedTransaction = mapFormToTransaction(parsedValues.data);
    const transaction = {
      ...mappedTransaction,
      createdAt: initialTransaction?.createdAt ?? new Date().toISOString(),
      id: initialTransaction?.id ?? mappedTransaction.id,
      updatedAt: initialTransaction ? new Date().toISOString() : undefined,
    };
    const isCreated = await onCreate(transaction);

    if (isCreated) {
      if (selectedContainer) {
        localStorageService.set('lastSelectedContainerId', selectedContainer.id);
      }

      if (selectedCategory) {
        setLastCategoryValues(selectedCategory);
      }

      if (values.paymentMethod) {
        localStorageService.set('lastPaymentMethod', values.paymentMethod);
      }

      localStorageService.set('lastTransactionDate', values.date);
      setValues(getCreateInitialValues(selectedContainer));
      setSelectedCategory(null);
      onClose();
    }
  }

  return (
    <Modal
      description="Create a transaction and sync it to your Google Sheets Ledger."
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit transaction' : 'Create transaction'}
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
          <DatePicker
            id="transaction-date"
            label="Date"
            onChange={(date) => setValues({ ...values, date })}
            value={values.date}
          />
          <CurrencySelect
            onChange={(currency) => setValues({ ...values, currency })}
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
        <div className="-mt-2 flex flex-wrap gap-2">
          {amountPresets.map((amount) => (
            <button
              className="rounded-full border border-zinc-200 px-3 py-1 text-sm font-medium text-zinc-600 transition hover:border-brand hover:text-brand"
              key={amount}
              onClick={() => setValues({ ...values, amount })}
              type="button"
            >
              {amount}
            </button>
          ))}
        </div>
        <CategoryCombobox kind={values.kind} onChange={selectCategory} value={selectedCategory} />
        {containersEnabled ? (
          <ContainerCombobox
            currency={values.currency}
            onChange={selectContainer}
            value={selectedContainer}
          />
        ) : null}
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
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            className="w-full sm:w-auto"
            disabled={isCreating}
            onClick={onClose}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" isLoading={isCreating} type="submit">
            {mode === 'edit' ? 'Save transaction' : 'Create transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
