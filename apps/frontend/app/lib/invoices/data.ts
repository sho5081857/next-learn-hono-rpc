import {
  InvoiceForm,
  InvoicesTable,
  LatestInvoice,
  LatestInvoiceRaw,
} from '../definitions';
import { getAccessToken, getApiUrl } from '../apiConfig';
import { redirect } from 'next/navigation';
import { UnauthorizedError } from '../errors';
import { formatCurrency } from '../utils';
import { AppType } from '../../../../backend/src/adapter/router/router';
import { hc } from 'hono/client';
import { headers } from 'next/headers';

export async function fetchLatestInvoices() {
  let latestInvoices = [] as LatestInvoice[];
  try {
    // const data = await sql<LatestInvoiceRaw>`
    //   SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
    //   FROM invoices
    //   JOIN customers ON invoices.customer_id = customers.id
    //   ORDER BY invoices.date DESC
    //   LIMIT 5`;
    const apiUrl = await getApiUrl();
    const token = await getAccessToken();
    const client = hc<AppType>(apiUrl);

    const res = await client.invoices.latest.$get({},{
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });


    // const data =dataJson as LatestInvoiceRaw[];
    // console.log(data);

    // const res = await fetch(apiUrl + '/invoices/latest', {
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${token}`,
    //   },
    // });
    if (!res.ok) {
      if (res.status === 401) {
        throw new UnauthorizedError();
      }
      throw new Error('Failed to fetch the latest invoices.');
    }

    const data:any = await res.json()
    const latestInvoiceRaw = data.items as LatestInvoiceRaw[];
    // console.log(latestInvoiceRaw);

    // const data = (await res.json()) as LatestInvoiceRaw[];

    latestInvoices = latestInvoiceRaw.map((invoice: LatestInvoiceRaw) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-out');
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred. Error details: ', error);
    }
  }
  return latestInvoices;
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  let invoices = [] as InvoicesTable[];
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // const invoices = await sql<InvoicesTable>`
    // SELECT
    //   invoices.id,
    //   invoices.amount,
    //   invoices.date,
    //   invoices.status,
    //   customers.name,
    //   customers.email,
    //   customers.image_url
    // FROM invoices
    // JOIN customers ON invoices.customer_id = customers.id
    // WHERE
    //   customers.name ILIKE ${`%${query}%`} OR
    //   customers.email ILIKE ${`%${query}%`} OR
    //   invoices.amount::text ILIKE ${`%${query}%`} OR
    //   invoices.date::text ILIKE ${`%${query}%`} OR
    //   invoices.status ILIKE ${`%${query}%`}
    // ORDER BY invoices.date DESC
    // LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    // `;

    const apiUrl = await getApiUrl();
    const token = await getAccessToken();
    const client = hc<AppType>(apiUrl)


    // const res = await fetch(
    //   apiUrl +
    //     '/invoices/filtered?page=' +
    //     currentPage +
    //     '&query=' +
    //     query +
    //     '&limit=' +
    //     ITEMS_PER_PAGE +
    //     '&offset=' +
    //     offset,
    //   {
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${token}`,
    //     },
    //   },
    // );

    const res = await client.invoices.filtered.$get({query: {query:query,limit:ITEMS_PER_PAGE, offset: offset}},{
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(res);

    if (!res.ok) {
      if (res.status === 401) {
        throw new UnauthorizedError();
      }
      throw new Error('Failed to fetch invoices.');
    }
    const data:any = await res.json();
    invoices = data.items as InvoicesTable[];
    // data = await res.json();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-out');
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred. Error details: ', error);
    }
  }
  return invoices;
}

export async function fetchInvoicesPages(query: string) {
  let totalPages = 0;
  try {
    //   const count = await sql`SELECT COUNT(*)
    //   FROM invoices
    //   JOIN customers ON invoices.customer_id = customers.id
    //   WHERE
    //     customers.name ILIKE ${`%${query}%`} OR
    //     customers.email ILIKE ${`%${query}%`} OR
    //     invoices.amount::text ILIKE ${`%${query}%`} OR
    //     invoices.date::text ILIKE ${`%${query}%`} OR
    //     invoices.status ILIKE ${`%${query}%`}
    // `;

    const apiUrl = await getApiUrl();
    const token = await getAccessToken();
    const client = hc<AppType>(apiUrl)

    const res = await client.invoices.pages.$get({query: {query}},{
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });


    // const res = await fetch(
    //   apiUrl + '/invoices/pages?query=' + query,
    //   {
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${token}`,
    //     },
    //   },
    // );

    if (!res.ok) {
      if (res.status === 401) {
        throw new UnauthorizedError();
      }
      throw new Error('Failed to fetch total number of invoices.');
    }

    const data:any = await res.json();
    const count = data.data;

    totalPages = Math.ceil(Number(count) / ITEMS_PER_PAGE);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-out');
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred. Error details: ', error);
    }
  }
  return totalPages;
}

export async function fetchInvoiceById(id: string) {
  let invoice = {} as InvoiceForm;
  try {
    // const data = await sql<InvoiceForm>`
    //   SELECT
    //     invoices.id,
    //     invoices.customer_id,
    //     invoices.amount,
    //     invoices.status
    //   FROM invoices
    //   WHERE invoices.id = ${id};
    // `;

    const apiUrl = await getApiUrl();
    const token = await getAccessToken();
    const client = hc<AppType>(apiUrl)

    const res = await client.invoices[':id'].$get({param: {
    id: id,
  },},{
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // const res = await fetch(apiUrl + '/invoices/' + id, {
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${token}`,
    //   },
    // });

    if (!res.ok) {
      if (res.status === 401) {
        throw new UnauthorizedError();
      }
      throw new Error('Failed to fetch invoice.');
    }

    const data:any = await res.json();
    invoice = data.data as InvoiceForm;

    data.amount = data.amount / 100;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-out');
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred. Error details: ', error);
    }
  }
  return invoice;
}
