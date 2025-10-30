export async function getStores(_: { status?: string; service?: string; q?: string }) { return { items: [] as Array<{ storeId: string; storeName: string }> }; }
