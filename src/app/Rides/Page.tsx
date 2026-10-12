// import AddOrganizationButton from "@/components/AddOrganization";
import { AllRidesTable } from "@/components/AllRides";
// import OrganizationSearch from "@/components/ui/OrganizationSearch";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"


const AllRidesPage: React.FC = () => {
  return (
    
      <div className="p-4">
        <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="#">
                          Rides
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>All Rides</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
        <h1 className="text-2xl font-bold pt-4">All Rides</h1>
        <div className="overflow-x-auto">
         <AllRidesTable/>
        </div>
       
      </div>
  
  );
}

export default AllRidesPage;
