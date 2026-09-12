using Microsoft.Data.SqlClient;
using System.Data;

namespace Task_Management_System.Models
{
    public interface IDBLayer
    {
        Task<int> ExecuteQueryAsync(string procname, SqlParameter[] parameter);
        Task<DataTable> TableAsync(string procname, SqlParameter[] parameters);
    }
}