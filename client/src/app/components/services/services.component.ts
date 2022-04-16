import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GlobalConstants } from 'src/app/common/global-constants';
import { Router } from '@angular/router';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})

export class ServicesComponent implements OnInit {

  servicesData = [];
  imageURL = GlobalConstants.imageURL;
  
  constructor(private http: HttpClient, private router: Router) { }

  bookService(service: any) {
    this.router.navigate(['/bookService'], {queryParams: {service_id: service['id'], service_name: service['name'], service_price: service['price']}});
  }

  ngOnInit() {
    this.http.get<any>('http://localhost:3000/api/getServices')
      .subscribe(data => {
        console.log(data);
        this.servicesData = data;
      }
    )
  }

}




