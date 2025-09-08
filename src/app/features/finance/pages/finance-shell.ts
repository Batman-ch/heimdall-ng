import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
@Component({
  standalone: true,
  selector: 'app-finance-shell',
  imports: [RouterOutlet],
  templateUrl: './finance-shell.html',
  styleUrl: './finance-shell.scss'
})
export class FinanceShell {

}
