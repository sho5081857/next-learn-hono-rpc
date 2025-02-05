'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getApiUrl, getAccessToken } from "../apiConfig";
import { UnauthorizedError } from "../errors";
import { AppType } from "../../../../backend/src/adapter/router/router";
import { hc } from "hono/client";



const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ date: true, id: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date();
console.log(customerId, amountInCents, status, date);
  try {
    // await sql`
    //   INSERT INTO invoices (customer_id, amount, status, date)
    //   VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    // `;
    const apiUrl = await getApiUrl();
    const token = await getAccessToken();
    const client = hc<AppType>(apiUrl);

    const res = await client.invoices.$post({
        json: {
          customer_id: customerId,
          amount: amountInCents,
          status: status,
          // date: date,
        },
}, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    );

    // const res = await fetch(apiUrl + '/invoices', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${token}`,
    //   },
    //   body: JSON.stringify({
    //     customer_id: customerId,
    //     amount: amountInCents,
    //     status: status,
    //     date: date,
    //   }),
    // });

    if (!res.ok) {
      if (res.status === 401) {
        throw new UnauthorizedError();
      }
      throw new Error();
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-out');
    }
    return {
      message: 'Error: Failed to Create Invoice.',
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  // const amountInCents = amount * 100;


  try {
    // await sql`
    //   UPDATE invoices
    //   SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    //   WHERE id = ${id}
    // `;
    const apiUrl = await getApiUrl();
    const token = await getAccessToken();
    const client = hc<AppType>(apiUrl);
    const res = await client.invoices[':id'].$patch({

      param: {
    id: id,
    },
      json: {
        customer_id: customerId,
        amount: amount,
        status: status,
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
   );
    // const res = await fetch(apiUrl + '/invoices/' + id, {
    //   method: 'PATCH',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${token}`,
    //   },
    //   body: JSON.stringify({
    //     customer_id: customerId,
    //     amount: amountInCents,
    //     status: status,
    //   }),
    // });
//     const data = await res.json();
// console.log(data);
    if (!res.ok) {
      console.log(res.status);
      if (res.status === 401) {
        throw new UnauthorizedError();
      }
      throw new Error();
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-out');
    }
    return {
      message: 'Error: Failed to Update Invoice.',
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    // await sql`DELETE FROM invoices WHERE id = ${id}`;

    const apiUrl = await getApiUrl();
    const token = await getAccessToken();
    const client = hc<AppType>(apiUrl);
    const res = await client.invoices[':id'].$delete({param: {
    id: id,
  },},{
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    // const res = await fetch(apiUrl + '/invoices/' + id, {
    //   method: 'DELETE',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${token}`,
    //   },
    // });

    if (!res.ok) {
      if (res.status === 401) {
        throw new UnauthorizedError();
      }
      throw new Error();
    }

    revalidatePath('/dashboard/invoices');
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-out');
    }
  }
}
