import { CustomerField, CustomersTableType, FormattedCustomersTable } from '../definitions';
import { getAccessToken, getApiUrl } from '../apiConfig';
import { UnauthorizedError } from '../errors';
import { redirect } from 'next/navigation';
import { formatCurrency } from '../utils';
import { AppType } from '../../../../backend/src/adapter/router/router';
import { hc } from 'hono/client';


export async function fetchCustomers() {
  let customers = [] as CustomerField[];
  try {
    // const data = await sql<CustomerField>`
    //   SELECT
    //     id,
    //     name
    //   FROM customers
    //   ORDER BY name ASC
    // `;

    const apiUrl = await getApiUrl();
    const token = await getAccessToken();
    const client = hc<AppType>(apiUrl)

    const res = await client.customers.$get({}, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // const res = await fetch(apiUrl + '/customers', {
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${token}`,
    //   },
    // });

    if (!res.ok) {
      if (res.status === 401) {
        throw new UnauthorizedError();
      }
      throw new Error('Failed to fetch all customers.');
    }

    const data:any = await res.json();
    customers = data.items;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-out');
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred. Error details: ', error);
    }
  }
  return customers;
}

export async function fetchFilteredCustomers(query: string) {
  let customers = [] as FormattedCustomersTable[];
  try {
    // const data = await sql<CustomersTableType>`
    // SELECT
    //   customers.id,
    //   customers.name,
    //   customers.email,
    //   customers.image_url,
    //   COUNT(invoices.id) AS total_invoices,
    //   SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
    //   SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
    // FROM customers
    // LEFT JOIN invoices ON customers.id = invoices.customer_id
    // WHERE
    //   customers.name ILIKE ${`%${query}%`} OR
    //     customers.email ILIKE ${`%${query}%`}
    // GROUP BY customers.id, customers.name, customers.email, customers.image_url
    // ORDER BY customers.name ASC
    // `;
    const apiUrl = await getApiUrl();
    const token = await getAccessToken();
    const client = hc<AppType>(apiUrl)

    const res = await client.customers.filtered.$get({ query: { query } }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // const res = await fetch(
    //   apiUrl + '/customers/filtered?query=' + query,
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
      throw new Error('Failed to fetch customer table.');
    }

    const data:any = await res.json();
    const customersTable = data.items as CustomersTableType[];

    // const data = (await res.json()) as CustomersTableType[];

    customers = customersTable.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-out');
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred. Error details: ', error);
    }
  }
  return customers;
}
