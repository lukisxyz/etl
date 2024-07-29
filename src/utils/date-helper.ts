import { format, parse } from 'date-fns';

const parseDate = (dateString: string | null): Date | null => {
  if (!dateString) return null;

  try {
    // Define the format used by MSSQL
    const parsedDate = parse(dateString, 'd-MMM-yyyy', new Date());

    // Format the date to 'yyyy-MM-dd' for PostgreSQL
    const formattedDate = format(parsedDate, 'yyyy-MM-dd');

    return new Date(formattedDate);
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

export { parseDate };
