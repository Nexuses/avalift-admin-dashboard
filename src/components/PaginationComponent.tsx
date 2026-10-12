import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

interface PaginationComponentProps {
  totalItems: number;
  rowsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const PaginationComponent: React.FC<PaginationComponentProps> = ({
  totalItems,
  rowsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const handlePrevious = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationPrevious onClick={handlePrevious} />
        {Array.from({ length: totalPages }, (_, index) => (
          <PaginationItem key={index}>
            <PaginationLink
              isActive={currentPage === index}
              onClick={() => onPageChange(index)}
            >
              {index + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationNext onClick={handleNext} />
      </PaginationContent>
    </Pagination>
  );
};
