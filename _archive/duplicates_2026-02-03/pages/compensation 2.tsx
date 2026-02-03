import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Plus, MoreVertical, Trash, Edit } from "lucide-react";
import { useCompensationList, useDeleteCompensation } from "../helpers/useCompensationApi";
import { Compensation } from "../helpers/schema";
import { Selectable } from "kysely";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/DropdownMenu";
import { CompensationDialog } from "../components/CompensationDialog";
import { toast } from "sonner";
import styles from "./compensation.module.css";

export default function CompensationPage() {
  const { data, isLoading } = useCompensationList();
  const deleteMutation = useDeleteCompensation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompensation, setSelectedCompensation] = useState<Selectable<Compensation> | null>(null);

  const handleAdd = () => {
    setSelectedCompensation(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (compensation: Selectable<Compensation>) => {
    setSelectedCompensation(compensation);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this compensation entry?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Compensation deleted successfully"),
          onError: () => toast.error("Failed to delete compensation"),
        }
      );
    }
  };

  const formatCurrency = (amount: number | string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Compensation | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Compensation</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Compensation
        </Button>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Effective Date</th>
              <th>Job</th>
              <th>Base Salary</th>
              <th>Bonus</th>
              <th>Equity</th>
              <th>Benefits Note</th>
              <th style={{ width: "50px" }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><Skeleton style={{ width: "80px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "150px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "100px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "80px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "80px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "150px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "24px", height: "24px" }} /></td>
                </tr>
              ))
            ) : data?.compensation.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No compensation records found. Add a record to get started!
                </td>
              </tr>
            ) : (
              data?.compensation.map((item) => (
                <tr key={item.id}>
                  <td className={styles.dateCell}>
                    {new Date(item.effectiveDate).toLocaleDateString()}
                  </td>
                  <td className={styles.jobCell}>
                    <div className={styles.jobTitle}>{item.jobTitle}</div>
                    <div className={styles.jobCompany}>{item.jobCompany}</div>
                  </td>
                  <td className={styles.moneyCell}>
                    {formatCurrency(item.baseSalary, item.currency)}
                  </td>
                  <td className={styles.moneyCell}>
                    {item.bonus ? formatCurrency(item.bonus, item.currency) : "-"}
                  </td>
                  <td className={styles.moneyCell}>
                    {item.equityValue ? formatCurrency(item.equityValue, item.currency) : "-"}
                  </td>
                  <td className={styles.truncateCell} title={item.benefitsNote || ""}>
                    {item.benefitsNote || "-"}
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className={styles.menuButton}>
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit size={14} style={{ marginRight: 8 }} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
                          className={styles.deleteItem}
                        >
                          <Trash size={14} style={{ marginRight: 8 }} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CompensationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        compensation={selectedCompensation}
      />
    </div>
  );
}