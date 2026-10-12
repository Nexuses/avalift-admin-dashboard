

// types/organization.ts
export interface Organization {
    name: string;
    last_name: string;
    first_name: string;
    id: number;
    organization_name: string; // Use this instead of 'name'
    email_id: string;
    country_code: string;
    mobile_number: string;
    // Remove 'address' since it’s not used in CorporateUserTable or the API
  }