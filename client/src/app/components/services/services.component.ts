import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GlobalConstants } from 'src/app/common/global-constants';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})

export class ServicesComponent implements OnInit {

  servicesData = [];
  
  constructor(private http: HttpClient) { }

  ngOnInit() {
    
    this.http.get<any>('http://localhost:3000/api/getServices')
      .subscribe(data => {
        console.log(data);
        this.servicesData = data;
      }
    )
  }

}




