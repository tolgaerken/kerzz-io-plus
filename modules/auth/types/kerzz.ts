export interface TRole {
  id: string
  name: string
  level?: number
  developer?: boolean
}

export interface TPermission {
  id: string
  permission: string
  group: string
}

export interface TUserLicance {
  roles: TRole[]
  allPermissions: TPermission[]
  brand: string
  id: string
  licanceId: string
  active?: boolean
  isSuspend?: boolean
  branchCodes: string[]
  orwiStore?: {
    id: string
    cloudId: string
    name: string
  }
}

export interface TUserInfo {
  id: string
  name: string
  accessToken: string
  mail: string
  phone: string
  licances: TUserLicance[]
}

// Kerzz SSO - App kullanıcı modeli
export interface APP_USER {
  id: string
  name: string
  mail: string
  phone: string
  gender: string
  image: string
  permissions: {
    push: boolean
    sms: boolean
    email: boolean
    phone: boolean
  }
  legalNotePermissions: {
    privacyPolicy: boolean
    clarificartion: boolean
    expressConsent: boolean
    membershipAgreement: boolean
  }
  userLanguage: string
  userRegion: string
  licances: {
    id: string
    brand: string
    licanceId: string
    roles: {
      id: string
      name: string
      level: number
      developer: boolean
    }[]
    branchCodes: string[]
    startDate: string
    endDate: string
    isSuspend: boolean
    isTrial: boolean
    statusText: string
    orwiStore?: {
      id: string
      cloudId: string
      name: string
    }
    allPermissions: {
      id: string
      permission: string
      group: string
    }[]
  }[]
  dateOfBirth?: string
  lastLoginDate?: string
  lastActionDate?: string
}