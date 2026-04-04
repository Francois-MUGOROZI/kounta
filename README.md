# kounta

The "Kounta" project aims to develop a sophisticated, user-centric personal
financial management platform

I see what we have done in transaction creation, but I think we need a
consolidated,clean and maintainable approach. Let discuss about this. My concern
are as follow:

- Two different places we do the computation because of receivable
- updating transaction is not ideal, transaction is created once not updated
- There are many other edge cases we need to look at in creating a transaction,
  we are free to redesign that function if necessary, it's very critical
