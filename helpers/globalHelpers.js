const getTipoInstrumento = (idInstrumento) => {
switch (idInstrumento) {
    case 1:
        return "Efectivo"
    case 2:
        return "Cheque"
    case 3:
        return "Transferencia"
    case 4:
        return "Deposito"
    default:
        break;
}
}
module.exports={getTipoInstrumento}