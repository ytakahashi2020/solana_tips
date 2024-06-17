use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, TransferChecked};
use anchor_spl::token_interface::{Mint, Token2022, TokenAccount};

// Program ID created by the playground
declare_id!("AbDhL7wVKGhpA2psvTbQdXPhedaonjAeU1U5ebQUNr7f");

#[program]
pub mod splitter {
    use super::*;

    /// Distributes `amount` of tokens from the `from` account to multiple recipient accounts.
    /// Each recipient must have an initialized and valid TokenAccount.
    ///
    /// # Arguments
    /// * `ctx` - The context containing all accounts needed for the transaction.
    /// * `amount` - The total amount of tokens to be distributed among recipients.
    ///
    /// # Errors
    /// Returns `InvalidTokenAccount` if any recipient account cannot be deserialized properly.
    pub fn send_to_all<'a, 'b, 'life>(
        ctx: Context<'a, 'b, 'life, 'life, SendTokens<'life>>,
        amount: u64,
    ) -> Result<()> {
        let from_account = ctx.accounts.from.to_account_info();
        let token_program = ctx.accounts.token_program.to_account_info();
        let authority_info = ctx.accounts.authority.to_account_info();
        let mint = ctx.accounts.mint.to_account_info();

        // Calculate the number of recipients.
        let num_recipients = ctx.remaining_accounts.len() as u64;
        if num_recipients < 2 {
            return Err(ErrorCode::InsufficientRecipients.into());
        }

        // Calculate the remaining amount (95% of the total amount).
        let remaining_amount = ((amount * 95 * 1_000) / 100) / 1_000;

        // Calculate the amount to send to each of the remaining recipients, truncating to 3 decimal places.
        let amount_per_recipient = (remaining_amount * 1_000 / (num_recipients - 1)) / 1_000;

        // Calculate the amount for the first recipient (5% of the total amount).
        let first_amount = amount - (amount_per_recipient * (num_recipients - 1));

        // Iterate over each recipient account and send tokens to them.
        for (i, recipient) in ctx.remaining_accounts.iter().enumerate() {
            let recipient_data = recipient.try_borrow_data()?;
            let mut slice_ref: &[u8] = &recipient_data;
            TokenAccount::try_deserialize(&mut slice_ref)
                .map_err(|_| error!(ErrorCode::InvalidTokenAccount))?;
            drop(recipient_data);

            let transfer_amount = if i == 0 {
                first_amount
            } else {
                amount_per_recipient
            };

            let transfer_cpi_accounts = TransferChecked {
                from: from_account.clone(),
                to: recipient.clone(),
                authority: authority_info.clone(),
                mint: mint.clone(),
            };

            let cpi_ctx = CpiContext::new(token_program.clone(), transfer_cpi_accounts);
            token_2022::transfer_checked(cpi_ctx, transfer_amount, ctx.accounts.mint.decimals)?;
        }

        Ok(())
    }
}

// Define the data structure for the accounts involved in the send_to_all function.
#[derive(Accounts)]
pub struct SendTokens<'info> {
    #[account(mut)]
    pub from: Box<InterfaceAccount<'info, TokenAccount>>,
    pub authority: Signer<'info>,
    #[account()]
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub token_program: Program<'info, Token2022>,
}

// Custom errors returned from this program.
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid Token Account. Please ensure the account is correctly initialized.")]
    InvalidTokenAccount,
    #[msg("Insufficient number of recipients. There must be at least two recipients.")]
    InsufficientRecipients,
}
