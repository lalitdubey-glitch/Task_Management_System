using Microsoft.Data.SqlClient;
using System.Data;

namespace Task_Management_System.Models
{
    public interface IDBLayer
    {
        int ExecuteQuery(string procname, SqlParameter[] parameter);
        DataTable table(string procname, SqlParameter[] parameters);
    }
}