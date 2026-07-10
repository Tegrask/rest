export interface OrderEvent {
  type: "NEW_ORDER" | "ORDER_UPDATED";
  order: unknown;
}

class OrderBroadcaster {
  private clients: Set<(event: OrderEvent) => void> = new Set();

  subscribe(listener: (event: OrderEvent) => void) {
    this.clients.add(listener);
    return () => this.clients.delete(listener);
  }

  broadcast(event: OrderEvent) {
    for (const listener of this.clients) {
      try {
        listener(event);
      } catch (error) {
        console.error("Failed to broadcast order event", error);
      }
    }
  }
}

export const orderBroadcaster = new OrderBroadcaster();
