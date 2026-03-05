export function determineCategoryWhereClause(categoryId: number) {
  switch (Number(categoryId)) {
    case 1:
      return { categoryName: 'Laptop', key: 'isLaptop', value: true };
    case 2:
      return { categoryName: 'Mobile', key: 'isMobile', value: true };
    case 3:
      return { categoryName: 'Tablet', key: 'isTab', value: true };
    case 4:
      return { categoryName: 'TV / Monitor', key: 'isLed', value: true };
    case 5:
      return { categoryName: 'Desktop', key: 'isDesktop', value: true };
    case 6:
      return { categoryName: 'Accessory', key: 'isAccessory', value: true };
    default:
      return null;
  }
}
export function determineRawWhereClause(categoryId: number) {
  switch (Number(categoryId)) {
    case 1:
      return 'is_laptop = 1';
    case 2:
      return 'is_mobile = 1';
    case 3:
      return 'is_tab = 1';
    case 4:
      return 'is_led = 1';
    case 5:
      return 'is_desktop = 1';
    case 6:
      return 'is_accessory = 1';
    default:
      return null;
  }
}
