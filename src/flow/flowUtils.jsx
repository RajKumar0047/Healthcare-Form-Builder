export function convertElementsToNodes(elements) {
  return elements.map((el, index) => ({
    id: el.id,
    type: "custom",
    position: { x: 100, y: index * 120 },
    data: { element: el }
  }));
}