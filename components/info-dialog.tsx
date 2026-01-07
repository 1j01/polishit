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
            <h3 className="font-semibold mb-2">Credits</h3>
            <div className="flex flex-col gap-1 text-muted-foreground">
              <p>
                Created by{" "}
                <a
                  href="https://isaiahodhner.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Isaiah Odhner
                </a>
              </p>
              <p>
                <a
                  href="https://github.com/1j01/polishit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Source code on GitHub
                </a>
              </p>
            </div>
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

          <section>
            <h3 className="font-semibold mb-2">FAQ</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Q: Why is it so hard?</AccordionTrigger>
                <AccordionContent>
                  A: If it were soft, polishing it would be much harder!
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Q: Why does the turd spin?</AccordionTrigger>
                <AccordionContent>
                  A: If you've watched the news, you know spin always helps with polishing turds.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Q: What has this world come to?</AccordionTrigger>
                <AccordionContent>
                  A: Institutions reward signaling over outcomes, outrage over compromise, profits over providence, and loyalty over competence—so the world reflects exactly what those systems select for. We are living in a late-stage capitalist dystopia where human connections are severed, there are no more forests for the children to play, and few hold onto hope that we can improve our systems enough to be a part of that change. But hey, at least we have PolishIt!™ to distract us from the existential dread.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
