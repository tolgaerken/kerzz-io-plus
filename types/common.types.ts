export interface TAddress {
  id?: string
  street: string
  city: string
  district: string
  postalCode: string
  country: string
  fullAddress?: string
}

export interface TPerson {
  id?: string
  name: string
  surname: string
  email?: string
  phone?: string
  title?: string
  department?: string
  isActive: boolean
} 