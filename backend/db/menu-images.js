/** Image paths for seeded menu items and categories. */
function menuItemImage(id) {
  return `/uploads/menu/${id}.jpg`;
}

function categoryImage(id) {
  return `/uploads/menu/categories/${id}.jpg`;
}

module.exports = { menuItemImage, categoryImage };
