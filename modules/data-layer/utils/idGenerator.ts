/**
 * ID Generator utility - Angular IdGeneratorService'den React'e uyarlandı
 */

export class IdGenerator {
  private static instance: IdGenerator;
  private ids: string[] = [];

  // Singleton pattern ile tek instance kullan
  public static getInstance(): IdGenerator {
    if (!IdGenerator.instance) {
      IdGenerator.instance = new IdGenerator();
    }
    return IdGenerator.instance;
  }

  /**
   * Maksimum karakter uzunluğunda benzersiz ID üretir
   */
  public generateMaxi(): string {
    let isUnique = false;
    let tempId = '';

    while (!isUnique) {
      tempId = this.generator();
      if (!this.idExists(tempId)) {
        isUnique = true;
        this.ids.push(tempId);
      }
    }

    return tempId;
  }

  /**
   * Mini ID üretir (daha kısa)
   */
  public generate(): string {
    let isUnique = false;
    let tempId = '';

    while (!isUnique) {
      tempId = this.generatorMini();
      if (!this.idExists(tempId)) {
        isUnique = true;
        this.ids.push(tempId);
      }
    }

    return tempId;
  }

  /**
   * ID'yi listeden kaldırır
   */
  public remove(id: string): void {
    const index = this.ids.indexOf(id);
    if (index > -1) {
      this.ids.splice(index, 1);
    }
  }

  /**
   * ID'nin var olup olmadığını kontrol eder
   */
  private idExists(id: string): boolean {
    return this.ids.includes(id);
  }

  /**
   * Maksimum uzunlukta ID üretir
   */
  private generator(): string {
    const s4Parts = Array.from({ length: 11 }, () => this.S4());
    return `${s4Parts[0]}${s4Parts[1]}-${s4Parts[2]}-${s4Parts[3]}-${s4Parts[4]}-${s4Parts[5]}${s4Parts[6]}${s4Parts[7]}!?@${s4Parts[8]}!${s4Parts[9]}**${s4Parts[10]}`;
  }

  /**
   * Mini ID üretir
   */
  private generatorMini(): string {
    return `${this.S4()}-${this.S4()}`;
  }

  /**
   * 4 karakterlik rastgele hex string üretir
   */
  private S4(): string {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
}

// Kolaylık fonksiyonları
export const generateMaxiId = (): string => {
  return IdGenerator.getInstance().generateMaxi();
};

export const generateMiniId = (): string => {
  return IdGenerator.getInstance().generate();
};

export const removeId = (id: string): void => {
  IdGenerator.getInstance().remove(id);
};
