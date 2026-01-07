"use client"

import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function InfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full h-9 w-9 md:h-12 md:w-12 bg-white/80 backdrop-blur border-blue-200 hover:bg-white hover:text-blue-600 transition-colors">
          <Info className="h-4 w-4 md:h-5 md:w-5" />
          <span className="sr-only">Info</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>About PolishIt!</DialogTitle>
          <DialogDescription>
            The ultimate polishing simulator.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          <section>
            <h3 className="font-semibold mb-2">Created by</h3>
            <p className="space-x-2">
              <a 
                href="https://isaiahodhner.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Isaiah Odhner
              </a>
              <span className="text-muted-foreground">•</span>
              <a 
                href="https://github.com/1j01/polishit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </a>
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Controls</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Click and drag outside the object to rotate view</li>
              <li>Mouse wheel to zoom</li>
              <li>Pinch to zoom (avoid touching the object)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Sharing</h3>
            <p className="text-muted-foreground">
              Use the Share button to create a custom link with your own plaque text to send to friends.
            </p>
          </section>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Q: Why is it so hard?</AccordionTrigger>
              <AccordionContent>
                A: If it were soft, polishing it would be much harder!
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  )
}
