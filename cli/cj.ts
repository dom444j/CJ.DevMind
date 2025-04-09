import { runRefactorAgent } from "../agents/refactor-agent";

const [, , command, ...args] = process.argv;

switch (command) {
  case "refactor":
    runRefactorAgent(args.join(" "));
    break;
  default:
    console.log("Comando desconocido. Usa: refactor [tarea]");
}


//node cli/cj.ts refactor dashboard/components
