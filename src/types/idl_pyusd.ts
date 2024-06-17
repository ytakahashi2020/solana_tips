import { Idl } from "@coral-xyz/anchor";
const IDL_pyusd: Idl = {
  //   address: "VWNonUKZ8TuHsXb1v8DPypfE7fcxGcopZNJDwbqHDtJ",
  version: "0.1.0",
  name: "splitter",
  instructions: [
    {
      name: "sendToAll",
      accounts: [
        { name: "from", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "mint", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidTokenAccount",
      msg: "Invalid Token Account. Please ensure the account is correctly initialized.",
    },
  ],
};

export default IDL_pyusd;
