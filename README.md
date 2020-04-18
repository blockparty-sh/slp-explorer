# SLP Token Explorer

A open source block explorer for Bitcoin Cash tokens based on the Simple Ledger Protocol (SLP).

![screenshot](/img/screenshot_large.jpg)

## Translations

Please see [TRANSLATIONS.md](TRANSLATIONS.md).

## How to add Token Icon?

Open a PR at https://github.com/kosinusbch/slp-token-icons

## Token Verification

The explorer has a list of "verified" tokens in `public/verified_tokens.json`. This is to help reduce the chance of someone namesquatting to perform a con. You should always verify the token id yourself to be sure, but since most people are too lazy to do that there is a checkmark that will appear next to tokens in the search dropdown which shows if they are in the verified list.

If you would like your token to be considered verified open a PR adding the token id to the list and provide some proof you are the owner of the token.

## Building

You need `Make`, `curl`, `npm` installed. 

```
cp .env.example .env
npm i
make
npm start
```

## Credits

[blockparty-sh](https://github.com/blockparty-sh) for all the dev work, [James Cramer](https://github.com/jcramer) ([simpleledger](https://github.com/simpleledger)), [kosinusbch](https://github.com/kosinusbch) for stylesheet, and [Evan](https://twitter.com/evanluza) from bitcoin.com for original design files
