import { Ticket } from "@/types/event"

export const findCheapestTicket = (tickets: Ticket[]) => {
    let cheapest: number = tickets.length == 0 ? 0 : tickets[0].price
    let cheapestTicket = undefined
    for (let i = 0; i < tickets.length; i++){
        const ticketPrice = tickets[i].price
        if (cheapest >= ticketPrice){
            cheapest = ticketPrice
            cheapestTicket = tickets[i]
        }
    }
    return cheapestTicket
}